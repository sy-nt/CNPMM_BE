import {
    loadImageUrlLookup,
    resolveImageUrl,
} from "@api/image/image.lifecycle";
import {
    CartEntity,
    ShopEntity,
    ShopStatus,
    SkuEntity,
    SpuEntity,
} from "@domain/entities";
import { GLOBAL_REDIS_KEY_PREFIX } from "@shared/constants";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError, NotFoundError } from "@shared/lib/http/httpError";
import { isUniqueViolationError } from "@shared/utils/db";
import { In } from "typeorm";

import {
    CART_MAX_ITEMS,
    CART_MAX_QUANTITY_PER_ITEM,
    CART_REDIS_TTL_SECONDS,
    CartError,
} from "./cart.constants";
import {
    AddItemRequestDto,
    CartItemResponseDto,
    CartItemShopSummaryDto,
    CartResponseDto,
    GetCartRequestDto,
    RemoveItemRequestDto,
    RemovePurchasedItemsRequestDto,
    UpdateItemRequestDto,
} from "./cart.dto";
import {
    CartItemRecord,
    CartItemUnavailableReason,
    EnrichedCartItem,
    HydrationMaps,
} from "./cart.type";

export class CartService extends BaseService {
    async addItem(dto: AddItemRequestDto): Promise<CartResponseDto> {
        await this._assertSkuPurchasable(dto.skuId);
        const cart = await this._getOrCreateCart(dto.userId);
        await this.repositories.cart.findOneByIdForUpdate(cart.id);
        const existing = await this.repositories.cartItem.findOne({
            where: { cartId: cart.id, skuId: dto.skuId },
        });
        if (existing) {
            const next = existing.quantity + dto.quantity;
            if (next > CART_MAX_QUANTITY_PER_ITEM) {
                throw new BadRequestError(CartError.QUANTITY_OUT_OF_BOUNDS);
            }
            await this.repositories.cartItem.update(
                { id: existing.id },
                { quantity: next },
            );
            await this._cacheUpsertItem(
                dto.userId,
                dto.skuId,
                existing.id,
                next,
            );
        } else {
            await this._assertCartCapacity(cart.id);
            const created = await this.repositories.cartItem.create({
                cartId: cart.id,
                quantity: dto.quantity,
                skuId: dto.skuId,
            });
            await this._cacheUpsertItem(
                dto.userId,
                dto.skuId,
                created.id,
                dto.quantity,
            );
        }
        return this.getCart({ userId: dto.userId });
    }

    async clearCart(userId: string): Promise<void> {
        const cart = await this.repositories.cart.findOne({
            select: { id: true },
            where: { userId },
        });
        if (!cart) {
            await this._cacheClear(userId);
            return;
        }
        await this.repositories.cartItem.delete({ cartId: cart.id });
        await this._cacheClear(userId);
    }

    async getCart(dto: GetCartRequestDto): Promise<CartResponseDto> {
        const cart = await this.repositories.cart.findOne({
            select: { id: true, updatedAt: true, userId: true },
            where: { userId: dto.userId },
        });
        const items = await this._loadCartItems(dto.userId, cart?.id);
        const enriched = await this._enrichItems(items);
        const withImageUrls = await this._attachImageUrls(enriched);
        return this._toCartResponse(dto.userId, withImageUrls, cart);
    }

    async removeItem(dto: RemoveItemRequestDto): Promise<CartResponseDto> {
        const cart = await this.repositories.cart.findOne({
            select: { id: true },
            where: { userId: dto.userId },
        });
        if (!cart) {
            return this.getCart({ userId: dto.userId });
        }
        await this.repositories.cart.findOneByIdForUpdate(cart.id);
        const existing = await this.repositories.cartItem.findOne({
            select: { id: true },
            where: { cartId: cart.id, skuId: dto.skuId },
        });
        if (!existing) {
            throw new NotFoundError(CartError.CART_ITEM_NOT_FOUND);
        }
        await this.repositories.cartItem.delete({ id: existing.id });
        await this._cacheRemoveItem(dto.userId, dto.skuId);
        return this.getCart({ userId: dto.userId });
    }

    async removePurchasedItems(
        dto: RemovePurchasedItemsRequestDto,
    ): Promise<void> {
        if (dto.items.length === 0) return;
        const cart = await this.repositories.cart.findOne({
            select: { id: true },
            where: { userId: dto.userId },
        });
        if (!cart) return;
        await this.repositories.cart.findOneByIdForUpdate(cart.id);
        for (const item of dto.items) {
            const existing = await this.repositories.cartItem.findOne({
                select: { id: true, quantity: true },
                where: { cartId: cart.id, skuId: item.skuId },
            });
            if (!existing) continue;
            if (item.quantity >= existing.quantity) {
                await this.repositories.cartItem.delete({ id: existing.id });
                await this._cacheRemoveItem(dto.userId, item.skuId);
                continue;
            }
            const remaining = existing.quantity - item.quantity;
            await this.repositories.cartItem.update(
                { id: existing.id },
                { quantity: remaining },
            );
            await this._cacheUpsertItem(
                dto.userId,
                item.skuId,
                existing.id,
                remaining,
            );
        }
    }

    async updateItem(dto: UpdateItemRequestDto): Promise<CartResponseDto> {
        await this._assertSkuPurchasable(dto.skuId);
        const cart = await this.repositories.cart.findOne({
            select: { id: true },
            where: { userId: dto.userId },
        });
        if (!cart) {
            throw new NotFoundError(CartError.CART_ITEM_NOT_FOUND);
        }
        await this.repositories.cart.findOneByIdForUpdate(cart.id);
        const existing = await this.repositories.cartItem.findOne({
            where: { cartId: cart.id, skuId: dto.skuId },
        });
        if (!existing) {
            throw new NotFoundError(CartError.CART_ITEM_NOT_FOUND);
        }
        await this.repositories.cartItem.update(
            { id: existing.id },
            { quantity: dto.quantity },
        );
        await this._cacheUpsertItem(
            dto.userId,
            dto.skuId,
            existing.id,
            dto.quantity,
        );
        return this.getCart({ userId: dto.userId });
    }

    private async _assertCartCapacity(cartId: string): Promise<void> {
        const rows = await this.repositories.cartItem.find({
            select: { id: true },
            where: { cartId },
        });
        if (rows.length >= CART_MAX_ITEMS) {
            throw new BadRequestError(CartError.CART_FULL);
        }
    }

    private async _assertSkuPurchasable(skuId: string): Promise<void> {
        const sku = await this.repositories.sku.findOne({
            select: { id: true, isActive: true, spuId: true },
            where: { id: skuId },
        });
        if (!sku) {
            throw new NotFoundError(CartError.SKU_NOT_FOUND);
        }
        if (!sku.isActive) {
            throw new BadRequestError(CartError.SKU_NOT_AVAILABLE);
        }
        const spu = await this.repositories.spu.findOne({
            select: { id: true, isActive: true, shopId: true },
            where: { id: sku.spuId },
        });
        if (!spu || !spu.isActive) {
            throw new BadRequestError(CartError.SKU_NOT_AVAILABLE);
        }
        const shop = await this.repositories.shop.findOne({
            select: { id: true, status: true },
            where: { id: spu.shopId },
        });
        if (!shop || shop.status !== ShopStatus.ACTIVE) {
            throw new BadRequestError(CartError.SHOP_NOT_AVAILABLE);
        }
    }

    private async _attachImageUrls(
        items: EnrichedCartItem[],
    ): Promise<EnrichedCartItem[]> {
        const lookup = await loadImageUrlLookup(
            this.repositories.image,
            items.map((item) => item.sku.imageKey),
        );
        return items.map((item) => ({
            ...item,
            sku: {
                ...item.sku,
                imageUrl: resolveImageUrl(item.sku.imageKey, lookup),
            },
        }));
    }

    private _buildAvailableItem(
        item: CartItemRecord,
        sku: SkuEntity,
        spu: SpuEntity | undefined,
        shop: ShopEntity | undefined,
        available: number,
    ): EnrichedCartItem {
        const reason = this._resolveUnavailableReason(
            sku,
            spu,
            shop,
            available,
            item.quantity,
        );
        const shopSummary: CartItemShopSummaryDto | undefined = shop
            ? {
                  id: shop.id,
                  name: shop.name,
                  slug: shop.slug,
                  status: shop.status,
              }
            : undefined;
        return {
            isAvailable: reason === undefined,
            quantity: item.quantity,
            reason,
            rowId: item.id,
            sku: {
                availableQuantity: available,
                id: sku.id,
                imageKey: sku.imageKey,
                isActive: sku.isActive,
                name: sku.name ?? spu?.name,
                price: sku.price,
                shop: shopSummary,
                spuId: sku.spuId,
            },
            skuId: sku.id,
            subtotal: this._computeSubtotal(sku.price, item.quantity),
        };
    }

    private _buildEnrichedItem(
        item: CartItemRecord,
        maps: HydrationMaps,
    ): EnrichedCartItem {
        const sku = maps.skuById.get(item.skuId);
        if (!sku) return this._buildMissingSkuEntry(item);
        const spu = maps.spuById.get(sku.spuId);
        const shop = spu ? maps.shopById.get(spu.shopId) : undefined;
        const available = maps.inventoryTotals.get(sku.id) ?? 0;
        return this._buildAvailableItem(item, sku, spu, shop, available);
    }

    private _buildMissingSkuEntry(item: CartItemRecord): EnrichedCartItem {
        return {
            isAvailable: false,
            quantity: item.quantity,
            reason: CartItemUnavailableReason.SKU_MISSING,
            rowId: item.id,
            sku: {
                availableQuantity: 0,
                id: item.skuId,
                isActive: false,
            },
            skuId: item.skuId,
            subtotal: "0.00",
        };
    }

    private _cacheClear(userId: string): Promise<number> {
        return this.redis.del(this._cacheKey(userId));
    }

    private _cacheDecode(raw: string): { id: string; quantity: number } | null {
        const separatorIdx = raw.indexOf(":");
        if (separatorIdx === -1) return null;
        const id = raw.slice(0, separatorIdx);
        const quantity = Number(raw.slice(separatorIdx + 1));
        if (!id || !Number.isFinite(quantity)) return null;
        return { id, quantity };
    }

    private _cacheEncode(id: string, quantity: number): string {
        return `${id}:${quantity}`;
    }

    private _cacheKey(userId: string): string {
        return `${GLOBAL_REDIS_KEY_PREFIX.CART}${userId}`;
    }

    private async _cacheRemoveItem(
        userId: string,
        skuId: string,
    ): Promise<void> {
        const key = this._cacheKey(userId);
        const pipeline = this.redis.pipeline();
        pipeline.hdel(key, skuId);
        pipeline.expire(key, CART_REDIS_TTL_SECONDS);
        await pipeline.exec();
    }

    private async _cacheReplace(
        userId: string,
        items: CartItemRecord[],
    ): Promise<void> {
        const key = this._cacheKey(userId);
        const pipeline = this.redis.pipeline();
        pipeline.del(key);
        if (items.length > 0) {
            const flat: string[] = [];
            for (const item of items) {
                if (!item.id) continue;
                flat.push(
                    item.skuId,
                    this._cacheEncode(item.id, item.quantity),
                );
            }
            if (flat.length > 0) {
                pipeline.hset(key, ...flat);
                pipeline.expire(key, CART_REDIS_TTL_SECONDS);
            }
        }
        await pipeline.exec();
    }

    private async _cacheUpsertItem(
        userId: string,
        skuId: string,
        rowId: string,
        quantity: number,
    ): Promise<void> {
        const key = this._cacheKey(userId);
        const pipeline = this.redis.pipeline();
        pipeline.hset(key, skuId, this._cacheEncode(rowId, quantity));
        pipeline.expire(key, CART_REDIS_TTL_SECONDS);
        await pipeline.exec();
    }

    private _computeSubtotal(
        price: string | undefined,
        quantity: number,
    ): string {
        if (!price) return "0.00";
        const numeric = Number(price) * quantity;
        if (!Number.isFinite(numeric)) return "0.00";
        return numeric.toFixed(2);
    }

    private async _enrichItems(
        items: CartItemRecord[],
    ): Promise<EnrichedCartItem[]> {
        if (items.length === 0) return [];
        const maps = await this._loadHydrationMaps(items);
        return items.map((item) => this._buildEnrichedItem(item, maps));
    }

    private async _getOrCreateCart(userId: string): Promise<CartEntity> {
        const existing = await this.repositories.cart.findOne({
            where: { userId },
        });
        if (existing) return existing;
        try {
            return await this.repositories.cart.create({ userId });
        } catch (error) {
            if (!isUniqueViolationError(error)) throw error;
            const concurrent = await this.repositories.cart.findOne({
                where: { userId },
            });
            if (!concurrent) throw error;
            return concurrent;
        }
    }

    private async _loadCartItems(
        userId: string,
        cartId?: string,
    ): Promise<CartItemRecord[]> {
        const cached = await this.redis.hgetall(this._cacheKey(userId));
        const cachedKeys = Object.keys(cached);
        if (cachedKeys.length > 0) {
            const decoded: CartItemRecord[] = [];
            let corrupt = false;
            for (const skuId of cachedKeys) {
                const value = this._cacheDecode(cached[skuId]);
                if (!value) {
                    corrupt = true;
                    break;
                }
                decoded.push({
                    id: value.id,
                    quantity: value.quantity,
                    skuId,
                });
            }
            if (!corrupt) return decoded;
            await this._cacheClear(userId);
        }
        if (!cartId) return [];
        const rows = await this.repositories.cartItem.find({
            select: { id: true, quantity: true, skuId: true },
            where: { cartId },
        });
        const items: CartItemRecord[] = rows.map((row) => ({
            id: row.id,
            quantity: row.quantity,
            skuId: row.skuId,
        }));
        await this._cacheReplace(userId, items);
        return items;
    }

    private async _loadHydrationMaps(
        items: CartItemRecord[],
    ): Promise<HydrationMaps> {
        const skuIds = items.map((item) => item.skuId);
        const [skus, inventoryTotals] = await Promise.all([
            this.repositories.sku.find({ where: { id: In(skuIds) } }),
            this.repositories.inventory.findAvailableTotals(skuIds),
        ]);
        const skuById = new Map(skus.map((sku) => [sku.id, sku]));
        const spuIds = Array.from(new Set(skus.map((sku) => sku.spuId)));
        const spus = spuIds.length
            ? await this.repositories.spu.find({
                  select: {
                      id: true,
                      isActive: true,
                      name: true,
                      shopId: true,
                  },
                  where: { id: In(spuIds) },
              })
            : [];
        const spuById = new Map(spus.map((spu) => [spu.id, spu]));
        const shopIds = Array.from(new Set(spus.map((spu) => spu.shopId)));
        const shops = shopIds.length
            ? await this.repositories.shop.find({
                  select: { id: true, name: true, slug: true, status: true },
                  where: { id: In(shopIds) },
              })
            : [];
        const shopById = new Map(shops.map((shop) => [shop.id, shop]));
        return { inventoryTotals, shopById, skuById, spuById };
    }

    private _resolveUnavailableReason(
        sku: SkuEntity,
        spu: SpuEntity | undefined,
        shop: ShopEntity | undefined,
        available: number,
        quantity: number,
    ): CartItemUnavailableReason | undefined {
        if (!sku.isActive) return CartItemUnavailableReason.SKU_INACTIVE;
        if (!spu) return CartItemUnavailableReason.SKU_MISSING;
        if (!spu.isActive) return CartItemUnavailableReason.SPU_INACTIVE;
        if (!shop || shop.status !== ShopStatus.ACTIVE) {
            return CartItemUnavailableReason.SHOP_INACTIVE;
        }
        if (available < quantity) {
            return CartItemUnavailableReason.OUT_OF_STOCK;
        }
        return undefined;
    }

    private _toCartResponse(
        userId: string,
        enriched: EnrichedCartItem[],
        cart?: { id: string; updatedAt?: Date } | null,
    ): CartResponseDto {
        const items: CartItemResponseDto[] = enriched.map((item) => ({
            id: item.rowId,
            isAvailable: item.isAvailable,
            quantity: item.quantity,
            reason: item.reason,
            shopId: item.sku.shop?.id,
            shopName: item.sku.shop?.name,
            sku: item.sku,
            skuId: item.skuId,
            subtotal: item.subtotal,
        }));
        const total = items
            .filter((item) => item.isAvailable)
            .reduce((acc, item) => acc + Number(item.subtotal), 0)
            .toFixed(2);
        const unavailableCount = items.filter(
            (item) => !item.isAvailable,
        ).length;
        return {
            id: cart?.id,
            items,
            total,
            unavailableCount,
            updatedAt: cart?.updatedAt,
            userId,
        };
    }
}

const cartService = new CartService();
export default cartService;
