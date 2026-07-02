import cartService from "@api/cart/cart.service";
import deliveryService from "@api/delivery/delivery.service";
import discountService from "@api/discount/discount.service";
import { DiscountEvaluationContext } from "@api/discount/discount.type";
import {
    AddressEntity,
    DiscountClaimEntity,
    DiscountScope,
    DiscountType,
    InventoryEntity,
    OrderEntity,
} from "@domain/entities";
import { GLOBAL_REDIS_KEY_PREFIX } from "@shared/constants";
import { RequestContextService } from "@shared/lib/context";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@shared/lib/http/httpError";
import notificationService from "@ws/notification/notification.service";
import { randomUUID } from "crypto";

import {
    CHECKOUT_LOCK_RELEASE_SCRIPT,
    CHECKOUT_REDIS_LOCK_TTL_SECONDS,
    OrderError,
} from "../order.constants";
import {
    CheckoutPreviewRequestDto,
    CheckoutPreviewResponseDto,
    PlaceOrderRequestDto,
    PlaceOrderResponseDto,
} from "../order.dto";
import {
    AppliedDiscount,
    CartLineHydrated,
    CheckoutPreviewBundle,
    PerShopBundle,
    PersistedBundleResult,
    WarehouseAllocation,
} from "../order.type";
import { OrderBaseService } from "./order.base.service";

export class OrderCheckoutService extends OrderBaseService {
    async placeOrder(
        dto: PlaceOrderRequestDto,
    ): Promise<PlaceOrderResponseDto> {
        const lockToken = await this._acquireCheckoutLock(dto.callerUserId);
        try {
            const plan = await this._buildCheckoutPlan(dto);
            this._assertExpectedTotal(plan, dto.expectedTotalAmount);
            const address = await this._getDestinationAddress(
                dto.destinationAddressId,
                dto.callerUserId,
            );
            const orders: OrderEntity[] = [];
            for (const previewBundle of plan.bundles) {
                const result = await this._persistBundle(
                    previewBundle,
                    dto.callerUserId,
                    address,
                );
                orders.push(result.order);
                RequestContextService.registerAfterCommit(() => {
                    notificationService.notifyOrderCreated({
                        id: result.order.id,
                        shopId: result.order.shopId,
                        status: result.order.status,
                        userId: result.order.userId,
                    });
                });
            }
            await this._removePurchasedCartItems(dto.callerUserId, plan);
            return this._buildPlaceResponse(plan, orders);
        } finally {
            await this._releaseCheckoutLock(dto.callerUserId, lockToken);
        }
    }

    async previewCheckout(
        dto: CheckoutPreviewRequestDto,
    ): Promise<CheckoutPreviewResponseDto> {
        return this._buildCheckoutPlan(dto);
    }

    private async _acquireCheckoutLock(userId: string): Promise<string> {
        const key = this._checkoutLockKey(userId);
        const token = randomUUID();
        const result = await this.redis.set(
            key,
            token,
            "EX",
            CHECKOUT_REDIS_LOCK_TTL_SECONDS,
            "NX",
        );
        if (result !== "OK") {
            throw new ConflictError(OrderError.CHECKOUT_LOCKED);
        }
        return token;
    }

    private _allocateForSku(
        item: CartLineHydrated,
        inventoryRows: InventoryEntity[],
        allowedWarehouses: Set<string>,
    ): WarehouseAllocation["perItem"][number] {
        const rows = inventoryRows
            .filter(
                (row) =>
                    row.skuId === item.skuId &&
                    allowedWarehouses.has(row.warehouseId),
            )
            .map((row) => ({
                available: row.quantity - row.reservedQuantity,
                warehouseId: row.warehouseId,
            }))
            .filter((row) => row.available > 0)
            .sort((a, b) => b.available - a.available);
        const allocations: { quantity: number; warehouseId: string }[] = [];
        let remaining = item.quantity;
        for (const row of rows) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, row.available);
            allocations.push({ quantity: take, warehouseId: row.warehouseId });
            remaining -= take;
        }
        if (remaining > 0) {
            throw new BadRequestError(OrderError.INSUFFICIENT_STOCK);
        }
        return { allocations, skuId: item.skuId };
    }

    private async _applyDiscount(args: {
        bundle: PerShopBundle;
        claims: DiscountClaimEntity[];
        consumedClaimId: Set<string>;
        deliveryFee: string;
        discountType: DiscountType;
        userId: string;
    }): Promise<AppliedDiscount | undefined> {
        const ctx = {
            deliveryFee: args.deliveryFee,
            evaluatedAt: new Date(),
            items: args.bundle.items.map((item) => ({
                quantity: item.quantity,
                shopId: item.shopId,
                skuId: item.skuId,
                spuId: item.spuId,
                unitPrice: item.unitPrice,
            })),
            userId: args.userId,
        };
        const fromClaim = await this._tryClaimedDiscount(args, ctx);
        if (fromClaim) return fromClaim;
        return this._tryAutoDiscount(args, ctx, args.discountType);
    }

    private _assertExpectedTotal(
        plan: CheckoutPreviewResponseDto,
        expected: string,
    ): void {
        if (Number(plan.grandTotal) !== Number(expected)) {
            throw new ConflictError(OrderError.PRICE_CHANGED);
        }
    }

    private async _buildCheckoutPlan(
        dto: CheckoutPreviewRequestDto,
    ): Promise<CheckoutPreviewResponseDto> {
        const lines = await this._loadCartLines(dto.callerUserId, dto.items);
        if (lines.length === 0) {
            throw new BadRequestError(OrderError.CART_EMPTY);
        }
        await this._getDestinationAddress(
            dto.destinationAddressId,
            dto.callerUserId,
        );
        const bundles = this._groupByShop(lines);
        const claims = await this._loadClaims(
            dto.callerUserId,
            dto.claimedDiscountIds,
        );
        const consumedClaimId = new Set<string>();
        const previewBundles: CheckoutPreviewBundle[] = [];
        for (const bundle of bundles) {
            previewBundles.push(
                await this._buildPreviewBundle(
                    bundle,
                    dto,
                    claims,
                    consumedClaimId,
                ),
            );
        }
        const grandTotal = previewBundles
            .reduce((acc, b) => acc + Number(b.totalAmount), 0)
            .toFixed(2);
        return { bundles: previewBundles, grandTotal };
    }

    private _buildPlaceResponse(
        plan: CheckoutPreviewResponseDto,
        orders: OrderEntity[],
    ): PlaceOrderResponseDto {
        return {
            bundles: plan.bundles,
            grandTotal: plan.grandTotal,
            orders: orders.map((order) => ({
                appliedDiscounts: {
                    delivery: order.deliveryDiscountId
                        ? {
                              amount: order.deliveryDiscountAmount,
                              discountId: order.deliveryDiscountId,
                          }
                        : undefined,
                    items: order.itemsDiscountId
                        ? {
                              amount: order.itemsDiscountAmount,
                              discountId: order.itemsDiscountId,
                          }
                        : undefined,
                },
                createdAt: order.createdAt,
                deliveryFee: order.deliveryFee,
                deliveryId: order.deliveryId,
                destinationAddressId: order.destinationAddressId,
                destinationAddressSnapshot: order.destinationAddressSnapshot,
                id: order.id,
                items: [],
                itemsSubtotal: order.itemsSubtotal,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                shopId: order.shopId,
                status: order.status,
                totalAmount: order.totalAmount,
                userId: order.userId,
            })),
        };
    }

    private async _buildPreviewBundle(
        bundle: PerShopBundle,
        dto: CheckoutPreviewRequestDto,
        claims: DiscountClaimEntity[],
        consumedClaimId: Set<string>,
    ): Promise<CheckoutPreviewBundle> {
        const allocation = await this._pickWarehouses(bundle);
        const quote = await this._getDeliveryQuote(
            bundle,
            allocation,
            dto.deliveryMethodId,
            dto.destinationAddressId,
            dto.callerUserId,
        );
        const itemsDiscount = await this._applyDiscount({
            bundle,
            claims,
            consumedClaimId,
            deliveryFee: quote.fee,
            discountType: DiscountType.ITEMS,
            userId: dto.callerUserId,
        });
        const deliveryDiscount = await this._applyDiscount({
            bundle,
            claims,
            consumedClaimId,
            deliveryFee: quote.fee,
            discountType: DiscountType.DELIVERY,
            userId: dto.callerUserId,
        });
        const total = this._computeTotal(
            bundle.itemsSubtotal,
            quote.fee,
            itemsDiscount?.amount,
            deliveryDiscount?.amount,
        );
        return {
            bundle,
            delivery: quote,
            discounts: { deliveryDiscount, itemsDiscount },
            totalAmount: total,
            warehouseAllocation: allocation,
        };
    }

    private async _bumpSoldCounts(items: CartLineHydrated[]): Promise<void> {
        const totals = this._aggregateBySpu(
            items.map((item) => ({ qty: item.quantity, spuId: item.spuId })),
        );
        for (const [spuId, qty] of totals.entries()) {
            const affected = await this.repositories.spu.bumpSoldCount(
                spuId,
                qty,
            );
            if (affected !== 1) {
                this.logger.warn("Failed to bump sold count", { qty, spuId });
            }
        }
    }

    private _checkoutLockKey(userId: string): string {
        return `${GLOBAL_REDIS_KEY_PREFIX.CHECKOUT_LOCK}${userId}`;
    }

    private _computeItemsSubtotal(items: CartLineHydrated[]): string {
        const total = items.reduce(
            (acc, item) => acc + Number(item.unitPrice) * item.quantity,
            0,
        );
        return total.toFixed(2);
    }

    private _computeTotal(
        itemsSubtotal: string,
        deliveryFee: string,
        itemsDiscount: string | undefined,
        deliveryDiscount: string | undefined,
    ): string {
        const total =
            Number(itemsSubtotal) -
            Number(itemsDiscount ?? 0) +
            Number(deliveryFee) -
            Number(deliveryDiscount ?? 0);
        return Math.max(0, total).toFixed(2);
    }

    private async _decrementInventory(
        allocation: WarehouseAllocation,
    ): Promise<void> {
        for (const item of allocation.perItem) {
            for (const alloc of item.allocations) {
                const affected =
                    await this.repositories.inventory.adjustWithGuard({
                        delta: -alloc.quantity,
                        skuId: item.skuId,
                        warehouseId: alloc.warehouseId,
                    });
                if (affected !== 1) {
                    throw new ConflictError(OrderError.INSUFFICIENT_STOCK);
                }
            }
        }
    }

    private async _getDeliveryQuote(
        bundle: PerShopBundle,
        allocation: WarehouseAllocation,
        deliveryMethodId: string,
        addressId: string,
        userId: string,
    ): Promise<CheckoutPreviewBundle["delivery"]> {
        const response = await deliveryService.quote({
            addressId,
            callerUserId: userId,
            items: bundle.items.map((item) => ({
                quantity: item.quantity,
                skuId: item.skuId,
            })),
            warehouseId: allocation.pickedOriginWarehouseId,
        });
        const picked = response.methods.find(
            (m) => m.methodId === deliveryMethodId,
        );
        if (!picked) {
            throw new BadRequestError(OrderError.NO_WAREHOUSE_AVAILABLE);
        }
        return {
            deliveryMethodId: picked.methodId,
            etaMaxDays: picked.etaMaxDays,
            etaMinDays: picked.etaMinDays,
            fee: picked.fee,
            originWarehouseId: allocation.pickedOriginWarehouseId,
            providerCode: picked.providerCode,
            zoneCode: picked.zoneCode,
        };
    }

    private async _getDestinationAddress(
        addressId: string,
        callerUserId: string,
    ): Promise<AddressEntity> {
        const address = await this.repositories.address.findOne({
            where: { id: addressId },
        });
        if (!address) {
            throw new NotFoundError(OrderError.DESTINATION_ADDRESS_NOT_FOUND);
        }
        if (address.userId !== callerUserId) {
            throw new ForbiddenError(OrderError.DESTINATION_ADDRESS_NOT_OWNED);
        }
        return address;
    }

    private _groupByShop(items: CartLineHydrated[]): PerShopBundle[] {
        const map = new Map<string, CartLineHydrated[]>();
        for (const item of items) {
            const list = map.get(item.shopId) ?? [];
            list.push(item);
            map.set(item.shopId, list);
        }
        const shopIds = Array.from(map.keys()).sort();
        return shopIds.map((shopId) => {
            const lines = map.get(shopId)!;
            return {
                items: lines,
                itemsSubtotal: this._computeItemsSubtotal(lines),
                shopId,
            };
        });
    }

    private async _loadCartLines(
        userId: string,
        selections: CheckoutPreviewRequestDto["items"],
    ): Promise<CartLineHydrated[]> {
        const cart = await cartService.getCart({ userId });
        if (cart.items.length === 0) {
            throw new BadRequestError(OrderError.CART_EMPTY);
        }
        const lines: CartLineHydrated[] = [];
        for (const selection of selections) {
            const cartItem = cart.items.find(
                (item) => item.skuId === selection.skuId,
            );
            if (!cartItem) {
                throw new BadRequestError(OrderError.CART_ITEM_NOT_FOUND);
            }
            const quantity = selection.quantity ?? cartItem.quantity;
            if (quantity > cartItem.quantity) {
                throw new BadRequestError(
                    OrderError.CART_ITEM_QUANTITY_EXCEEDED,
                );
            }
            if (!cartItem.isAvailable) {
                throw new BadRequestError(OrderError.SKU_NOT_PURCHASABLE);
            }
            if (
                !cartItem.sku.spuId ||
                !cartItem.sku.shop ||
                !cartItem.sku.price
            ) {
                throw new BadRequestError(OrderError.SKU_NOT_PURCHASABLE);
            }
            lines.push({
                imageKey: cartItem.sku.imageKey,
                name: cartItem.sku.name ?? "Item",
                quantity,
                shopId: cartItem.sku.shop.id,
                skuId: cartItem.skuId,
                spuId: cartItem.sku.spuId,
                unitPrice: cartItem.sku.price,
            });
        }
        return lines;
    }

    private async _loadClaims(
        userId: string,
        ids: string[] | undefined,
    ): Promise<DiscountClaimEntity[]> {
        if (!ids || ids.length === 0) return [];
        return this.repositories.discountClaim.findByIdsForUser(ids, userId);
    }

    private async _persistBundle(
        previewBundle: CheckoutPreviewBundle,
        userId: string,
        address: AddressEntity,
    ): Promise<PersistedBundleResult> {
        await this._decrementInventory(previewBundle.warehouseAllocation);
        const order = await this.repositories.order.create({
            deliveryDiscountAmount:
                previewBundle.discounts.deliveryDiscount?.amount ?? "0.00",
            deliveryDiscountId:
                previewBundle.discounts.deliveryDiscount?.discountId,
            deliveryFee: previewBundle.delivery.fee,
            destinationAddressId: address.id,
            destinationAddressSnapshot: this._snapshotAddress(address),
            itemsDiscountAmount:
                previewBundle.discounts.itemsDiscount?.amount ?? "0.00",
            itemsDiscountId: previewBundle.discounts.itemsDiscount?.discountId,
            itemsSubtotal: previewBundle.bundle.itemsSubtotal,
            shopId: previewBundle.bundle.shopId,
            totalAmount: previewBundle.totalAmount,
            userId,
        });
        await this._persistOrderItems(order, previewBundle);
        await this._bumpSoldCounts(previewBundle.bundle.items);
        await this._persistDelivery(order, previewBundle, address.id);
        const redemptions = await this._persistRedemptions(
            order,
            previewBundle,
            userId,
        );
        return { order: await this._getOrderOrThrow(order.id), redemptions };
    }

    private async _persistDelivery(
        order: OrderEntity,
        previewBundle: CheckoutPreviewBundle,
        addressId: string,
    ): Promise<void> {
        const delivery = await deliveryService.createDelivery({
            deliveryMethodId: previewBundle.delivery.deliveryMethodId,
            destinationAddressId: addressId,
            etaMaxDays: previewBundle.delivery.etaMaxDays,
            etaMinDays: previewBundle.delivery.etaMinDays,
            fee: previewBundle.delivery.fee,
            orderId: order.id,
            warehouseId: previewBundle.delivery.originWarehouseId,
            zoneCode: previewBundle.delivery.zoneCode,
        });
        await this.repositories.order.update(
            { id: order.id },
            { deliveryId: delivery.id },
        );
    }

    private async _persistOrderItems(
        order: OrderEntity,
        previewBundle: CheckoutPreviewBundle,
    ): Promise<void> {
        const rows = previewBundle.bundle.items.map((item) => {
            const alloc = previewBundle.warehouseAllocation.perItem.find(
                (a) => a.skuId === item.skuId,
            );
            return {
                imageKeySnapshot: item.imageKey,
                nameSnapshot: item.name,
                orderId: order.id,
                quantity: item.quantity,
                skuId: item.skuId,
                spuIdSnapshot: item.spuId,
                subtotal: (Number(item.unitPrice) * item.quantity).toFixed(2),
                unitPriceSnapshot: item.unitPrice,
                warehouseAllocation: alloc?.allocations ?? [],
            };
        });
        await this.repositories.orderItem.createMany(rows);
    }

    private async _persistRedemptions(
        order: OrderEntity,
        previewBundle: CheckoutPreviewBundle,
        userId: string,
    ): Promise<{ discountId: string; redeemedAmount: string }[]> {
        const records: { discountId: string; redeemedAmount: string }[] = [];
        const apply = async (
            discount: AppliedDiscount | undefined,
        ): Promise<void> => {
            if (!discount) return;
            if (discount.claimId) {
                await discountService.consumeClaim({
                    claimId: discount.claimId,
                    orderId: order.id,
                    redeemedAmount: discount.amount,
                    userId,
                });
            } else {
                await discountService.recordRedemption({
                    discountId: discount.discountId,
                    orderId: order.id,
                    redeemedAmount: discount.amount,
                    userId,
                });
            }
            records.push({
                discountId: discount.discountId,
                redeemedAmount: discount.amount,
            });
        };
        await apply(previewBundle.discounts.itemsDiscount);
        await apply(previewBundle.discounts.deliveryDiscount);
        return records;
    }

    private _pickOriginWarehouse(
        perItem: WarehouseAllocation["perItem"],
    ): string {
        const totals = new Map<string, number>();
        for (const item of perItem) {
            for (const alloc of item.allocations) {
                totals.set(
                    alloc.warehouseId,
                    (totals.get(alloc.warehouseId) ?? 0) + alloc.quantity,
                );
            }
        }
        let bestId = "";
        let bestTotal = -1;
        for (const [warehouseId, total] of totals.entries()) {
            if (total > bestTotal) {
                bestId = warehouseId;
                bestTotal = total;
            }
        }
        return bestId;
    }

    private async _pickWarehouses(
        bundle: PerShopBundle,
    ): Promise<WarehouseAllocation> {
        const warehouses = await this.repositories.warehouse.find({
            select: { id: true, shopId: true },
            where: { isActive: true, shopId: bundle.shopId },
        });
        if (warehouses.length === 0) {
            throw new BadRequestError(OrderError.NO_WAREHOUSE_AVAILABLE);
        }
        const warehouseIds = new Set(warehouses.map((w) => w.id));
        const skuIds = bundle.items.map((item) => item.skuId);
        const inventoryRows =
            await this.repositories.inventory.findBySkuIds(skuIds);
        const perItem = bundle.items.map((item) =>
            this._allocateForSku(item, inventoryRows, warehouseIds),
        );
        const origin = this._pickOriginWarehouse(perItem);
        return { perItem, pickedOriginWarehouseId: origin };
    }

    private async _releaseCheckoutLock(
        userId: string,
        token: string,
    ): Promise<void> {
        await this.redis.eval(
            CHECKOUT_LOCK_RELEASE_SCRIPT,
            1,
            this._checkoutLockKey(userId),
            token,
        );
    }

    private async _removePurchasedCartItems(
        userId: string,
        plan: CheckoutPreviewResponseDto,
    ): Promise<void> {
        const items = plan.bundles.flatMap((bundle) =>
            bundle.bundle.items.map((item) => ({
                quantity: item.quantity,
                skuId: item.skuId,
            })),
        );
        await cartService.removePurchasedItems({ items, userId });
    }

    private async _tryAutoDiscount(
        args: {
            bundle: PerShopBundle;
            discountType: DiscountType;
        },
        ctx: {
            deliveryFee: string;
            evaluatedAt: Date;
            items: {
                quantity: number;
                shopId: string;
                skuId: string;
                spuId: string;
                unitPrice: string;
            }[];
            userId: string;
        },
        discountType: DiscountType,
    ): Promise<AppliedDiscount | undefined> {
        const auto = await discountService.getBestAutoDiscount({
            ctx,
            discountType,
            scopes: [DiscountScope.GLOBAL, DiscountScope.SHOP],
            shopIds: [args.bundle.shopId],
        });
        if (!auto || !auto.isEligible) return undefined;
        return { amount: auto.appliedAmount, discountId: auto.discountId };
    }

    private async _tryClaimedDiscount(
        args: {
            bundle: PerShopBundle;
            claims: DiscountClaimEntity[];
            consumedClaimId: Set<string>;
            discountType: DiscountType;
        },
        ctx: DiscountEvaluationContext,
    ): Promise<AppliedDiscount | undefined> {
        for (const claim of args.claims) {
            if (args.consumedClaimId.has(claim.id)) continue;
            const discount = claim.discount;
            if (discount.discountType !== args.discountType) continue;
            if (
                discount.scope === DiscountScope.SHOP &&
                discount.shopId !== args.bundle.shopId
            ) {
                continue;
            }
            const result = await discountService.evaluate(discount, ctx);
            if (!result.isEligible) continue;
            args.consumedClaimId.add(claim.id);
            return {
                amount: result.appliedAmount,
                claimId: claim.id,
                discountId: result.discountId,
            };
        }
        return undefined;
    }
}

const orderCheckoutService = new OrderCheckoutService();
export { orderCheckoutService };
