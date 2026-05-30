import { ShopEntity, SkuEntity, SpuEntity } from "@domain/entities";

import type { CartItemSkuSummaryDto } from "./cart.dto";

export enum CartItemUnavailableReason {
    OUT_OF_STOCK = "out_of_stock",
    SHOP_INACTIVE = "shop_inactive",
    SKU_INACTIVE = "sku_inactive",
    SKU_MISSING = "sku_missing",
    SPU_INACTIVE = "spu_inactive",
}

export type CartItemRecord = {
    id?: string;
    quantity: number;
    skuId: string;
};

export type EnrichedCartItem = {
    isAvailable: boolean;
    quantity: number;
    reason?: CartItemUnavailableReason;
    rowId?: string;
    sku: CartItemSkuSummaryDto;
    skuId: string;
    subtotal: string;
};

export type HydrationMaps = {
    inventoryTotals: Map<string, number>;
    shopById: Map<string, ShopEntity>;
    skuById: Map<string, SkuEntity>;
    spuById: Map<string, SpuEntity>;
};
