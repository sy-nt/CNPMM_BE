import cartService from "@api/cart/cart.service";
import deliveryService from "@api/delivery/delivery.service";
import discountService from "@api/discount/discount.service";
import { DiscountEvaluationContext } from "@api/discount/discount.type";
import {
    AddressEntity,
    DeliveryStatus,
    DiscountClaimEntity,
    DiscountScope,
    DiscountType,
    InventoryEntity,
    OrderEntity,
    OrderItemEntity,
    OrderStatus,
    PaymentStatus,
} from "@domain/entities";
import { GLOBAL_REDIS_KEY_PREFIX } from "@shared/constants";
import { BaseService } from "@shared/lib/base/service";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@shared/lib/http/httpError";
import rbacService from "@shared/lib/rbac/rbac.service";
import { randomUUID } from "crypto";

import {
    CHECKOUT_LOCK_RELEASE_SCRIPT,
    CHECKOUT_REDIS_LOCK_TTL_SECONDS,
    ORDER_CANCELLABLE_BY_CUSTOMER,
    ORDER_CANCELLABLE_BY_SHOP,
    ORDER_STATUS_TRANSITIONS,
    OrderCancelledByRole,
    OrderError,
} from "./order.constants";
import {
    CancelOrderRequestDto,
    CheckoutPreviewRequestDto,
    CheckoutPreviewResponseDto,
    GetOrderRequestDto,
    GetOrdersRequestDto,
    GetOrdersResponseDto,
    OrderResponseDto,
    PlaceOrderRequestDto,
    PlaceOrderResponseDto,
    UpdateOrderStatusRequestDto,
} from "./order.dto";
import {
    AppliedDiscount,
    CartLineHydrated,
    CheckoutPreviewBundle,
    PerShopBundle,
    PersistedBundleResult,
    WarehouseAllocation,
} from "./order.type";

export class OrderService extends BaseService {
    async cancelOrder(dto: CancelOrderRequestDto): Promise<OrderResponseDto> {
        const order = await this._getOrderOrThrow(dto.id);
        const cancelledByRole = this._resolveCancelRole(order, dto);
        this._assertCancelAllowed(order.status, cancelledByRole);
        const affected = await this.repositories.order.transitionToCancelled({
            cancellationReason: dto.reason,
            cancelledAt: new Date(),
            cancelledByRoleName: cancelledByRole,
            cancelledByUserId: dto.callerUserId,
            fromStatuses: Array.from(
                this._cancellableStatuses(cancelledByRole),
            ),
            orderId: order.id,
        });
        if (affected === 0) {
            return this._handleCancelLost(order.id);
        }
        const items = await this.repositories.orderItem.findByOrderId(order.id);
        await this._restockInventory(items);
        await this._decrementSoldCounts(items);
        await discountService.releaseRedemption(order.id);
        return this._buildOrderResponse(await this._getOrderOrThrow(order.id));
    }

    async getOrder(dto: GetOrderRequestDto): Promise<OrderResponseDto> {
        const order = await this._getOrderOrThrow(dto.id);
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        this._assertOrderAccess(
            order,
            dto.callerShopId,
            dto.callerUserId,
            isAdmin,
        );
        return this._buildOrderResponse(order);
    }

    async getOrders(dto: GetOrdersRequestDto): Promise<GetOrdersResponseDto> {
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        const where = this._buildOrdersWhere(dto, isAdmin);
        if (where === null) {
            return this._emptyPage(dto);
        }
        const result = await this.repositories.order.paginate(
            { where },
            {
                limit: dto.limit,
                orderBy: dto.orderBy,
                page: dto.page,
                sort: dto.sort,
            },
        );
        const items = await Promise.all(
            result.items.map((order) => this._buildOrderResponse(order)),
        );
        return { ...result, items };
    }

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
            }
            await cartService.clearCart(dto.callerUserId);
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

    async updateOrderStatus(
        dto: UpdateOrderStatusRequestDto,
    ): Promise<OrderResponseDto> {
        const order = await this._getOrderOrThrow(dto.id);
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        this._assertOrderAccess(order, dto.callerShopId, undefined, isAdmin);
        this._assertStatusTransition(order.status, dto.status);
        const patch = this._buildStatusPatch(dto.status);
        await this.repositories.order.update({ id: order.id }, patch);
        if (order.deliveryId) {
            await this._advanceLinkedDelivery(
                order.deliveryId,
                dto.status,
                dto.callerRoleId,
                dto.callerShopId,
            );
        }
        return this._buildOrderResponse(await this._getOrderOrThrow(order.id));
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

    private async _advanceLinkedDelivery(
        deliveryId: string,
        orderStatus: OrderStatus,
        callerRoleId?: string,
        callerShopId?: string,
    ): Promise<void> {
        const nextDeliveryStatus = this._mapOrderToDeliveryStatus(orderStatus);
        if (!nextDeliveryStatus) return;
        await deliveryService.updateDeliveryStatus({
            callerRoleId,
            callerShopId,
            id: deliveryId,
            status: nextDeliveryStatus,
        });
    }

    private _aggregateBySpu(
        rows: Array<{ qty: number; spuId: string }>,
    ): Map<string, number> {
        const totals = new Map<string, number>();
        for (const row of rows) {
            totals.set(row.spuId, (totals.get(row.spuId) ?? 0) + row.qty);
        }
        return totals;
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

    private _assertCancelAllowed(
        status: OrderStatus,
        cancelledByRole: OrderCancelledByRole,
    ): void {
        const allowed =
            cancelledByRole === OrderCancelledByRole.CUSTOMER
                ? ORDER_CANCELLABLE_BY_CUSTOMER
                : ORDER_CANCELLABLE_BY_SHOP;
        if (!allowed.has(status)) {
            throw new BadRequestError(OrderError.ORDER_NOT_CANCELLABLE);
        }
    }

    private _assertExpectedTotal(
        plan: CheckoutPreviewResponseDto,
        expected: string,
    ): void {
        if (Number(plan.grandTotal) !== Number(expected)) {
            throw new ConflictError(OrderError.PRICE_CHANGED);
        }
    }

    private _assertOrderAccess(
        order: OrderEntity,
        callerShopId: string | undefined,
        callerUserId: string | undefined,
        isAdmin: boolean,
    ): void {
        if (isAdmin) return;
        if (callerUserId && order.userId === callerUserId) return;
        if (callerShopId && order.shopId === callerShopId) return;
        throw new ForbiddenError(OrderError.ORDER_FORBIDDEN);
    }

    private _assertStatusTransition(from: OrderStatus, to: OrderStatus): void {
        if (from === to) return;
        const allowed = ORDER_STATUS_TRANSITIONS[from] ?? [];
        if (!allowed.includes(to)) {
            throw new BadRequestError(OrderError.INVALID_STATUS_TRANSITION);
        }
    }

    private async _buildCheckoutPlan(
        dto: CheckoutPreviewRequestDto,
    ): Promise<CheckoutPreviewResponseDto> {
        const lines = await this._loadCartLines(dto.callerUserId);
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

    private async _buildOrderResponse(
        order: OrderEntity,
    ): Promise<OrderResponseDto> {
        const items = await this.repositories.orderItem.findByOrderId(order.id);
        return {
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
            cancellationReason: order.cancellationReason,
            cancelledAt: order.cancelledAt,
            deliveryFee: order.deliveryFee,
            deliveryId: order.deliveryId,
            destinationAddressId: order.destinationAddressId,
            destinationAddressSnapshot: order.destinationAddressSnapshot,
            id: order.id,
            items: items.map((item) => this._toOrderItemResponse(item)),
            itemsSubtotal: order.itemsSubtotal,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            shopId: order.shopId,
            status: order.status,
            totalAmount: order.totalAmount,
            userId: order.userId,
        };
    }

    private _buildOrdersWhere(
        dto: GetOrdersRequestDto,
        isAdmin: boolean,
    ): null | Record<string, unknown> {
        const base: Record<string, unknown> = {};
        if (dto.status) base.status = dto.status;
        if (isAdmin) return base;
        if (dto.callerShopId) {
            return { ...base, shopId: dto.callerShopId };
        }
        if (dto.callerUserId) {
            return { ...base, userId: dto.callerUserId };
        }
        return null;
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

    private _buildStatusPatch(status: OrderStatus): Record<string, unknown> {
        const now = new Date();
        const patch: Record<string, unknown> = { status };
        if (status === OrderStatus.CONFIRMED) patch.confirmedAt = now;
        if (status === OrderStatus.PROCESSING) patch.processingAt = now;
        if (status === OrderStatus.SHIPPED) patch.shippedAt = now;
        if (status === OrderStatus.DELIVERED) patch.deliveredAt = now;
        if (status === OrderStatus.COMPLETED) {
            patch.completedAt = now;
            patch.paymentStatus = PaymentStatus.PAID;
        }
        return patch;
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

    private _cancellableStatuses(role: OrderCancelledByRole): Set<OrderStatus> {
        if (role === OrderCancelledByRole.CUSTOMER) {
            return ORDER_CANCELLABLE_BY_CUSTOMER;
        }
        return ORDER_CANCELLABLE_BY_SHOP;
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

    private async _decrementSoldCounts(
        items: OrderItemEntity[],
    ): Promise<void> {
        const totals = this._aggregateBySpu(
            items.map((item) => ({
                qty: item.quantity,
                spuId: item.spuIdSnapshot,
            })),
        );
        for (const [spuId, qty] of totals.entries()) {
            const affected = await this.repositories.spu.decrementSoldCount(
                spuId,
                qty,
            );
            if (affected !== 1) {
                this.logger.warn("Failed to decrement sold count", {
                    qty,
                    spuId,
                });
            }
        }
    }

    private _emptyPage(dto: GetOrdersRequestDto): GetOrdersResponseDto {
        return {
            currentPage: dto.page,
            items: [],
            limit: dto.limit,
            total: 0,
            totalPage: 0,
        };
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

    private async _getOrderOrThrow(id: string): Promise<OrderEntity> {
        const order = await this.repositories.order.findOne({ where: { id } });
        if (!order) {
            throw new NotFoundError(OrderError.ORDER_NOT_FOUND);
        }
        return order;
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

    private async _handleCancelLost(
        orderId: string,
    ): Promise<OrderResponseDto> {
        const fresh = await this._getOrderOrThrow(orderId);
        if (fresh.status === OrderStatus.CANCELLED) {
            return this._buildOrderResponse(fresh);
        }
        throw new ConflictError(OrderError.ORDER_NOT_CANCELLABLE);
    }

    private async _loadCartLines(userId: string): Promise<CartLineHydrated[]> {
        const cart = await cartService.getCart({ userId });
        const unavailable = cart.items.find((item) => !item.isAvailable);
        if (unavailable) {
            throw new BadRequestError(OrderError.SKU_NOT_PURCHASABLE);
        }
        return cart.items.map((item) => {
            if (!item.sku.spuId || !item.sku.shop || !item.sku.price) {
                throw new BadRequestError(OrderError.SKU_NOT_PURCHASABLE);
            }
            return {
                imageKey: item.sku.imageKey,
                name: item.sku.name ?? "Item",
                quantity: item.quantity,
                shopId: item.sku.shop.id,
                skuId: item.skuId,
                spuId: item.sku.spuId,
                unitPrice: item.sku.price,
            };
        });
    }

    private async _loadClaims(
        userId: string,
        ids: string[] | undefined,
    ): Promise<DiscountClaimEntity[]> {
        if (!ids || ids.length === 0) return [];
        return this.repositories.discountClaim.findByIdsForUser(ids, userId);
    }

    private _mapOrderToDeliveryStatus(
        orderStatus: OrderStatus,
    ): DeliveryStatus | null {
        if (orderStatus === OrderStatus.SHIPPED)
            return DeliveryStatus.IN_TRANSIT;
        if (orderStatus === OrderStatus.DELIVERED)
            return DeliveryStatus.DELIVERED;
        return null;
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

    private _resolveCancelRole(
        order: OrderEntity,
        dto: CancelOrderRequestDto,
    ): OrderCancelledByRole {
        if (dto.callerUserId && order.userId === dto.callerUserId) {
            return OrderCancelledByRole.CUSTOMER;
        }
        if (dto.callerShopId && order.shopId === dto.callerShopId) {
            return OrderCancelledByRole.SHOP;
        }
        throw new ForbiddenError(OrderError.ORDER_FORBIDDEN);
    }

    private async _restockInventory(items: OrderItemEntity[]): Promise<void> {
        for (const item of items) {
            for (const alloc of item.warehouseAllocation ?? []) {
                const affected =
                    await this.repositories.inventory.adjustWithGuard({
                        delta: alloc.quantity,
                        skuId: item.skuId,
                        warehouseId: alloc.warehouseId,
                    });
                if (affected !== 1) {
                    throw new ConflictError(OrderError.RESTOCK_FAILED);
                }
            }
        }
    }

    private _snapshotAddress(address: AddressEntity) {
        return {
            addressLine: address.addressLine,
            city: address.city,
            country: address.country,
            district: address.district,
            latitude: address.latitude,
            longitude: address.longitude,
            name: address.name,
            state: address.state,
        };
    }

    private _toOrderItemResponse(item: OrderItemEntity) {
        return {
            id: item.id,
            imageKeySnapshot: item.imageKeySnapshot,
            nameSnapshot: item.nameSnapshot,
            quantity: item.quantity,
            skuId: item.skuId,
            spuIdSnapshot: item.spuIdSnapshot,
            subtotal: item.subtotal,
            unitPriceSnapshot: item.unitPriceSnapshot,
            warehouseAllocation: item.warehouseAllocation,
        };
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

const orderService = new OrderService();
export default orderService;
