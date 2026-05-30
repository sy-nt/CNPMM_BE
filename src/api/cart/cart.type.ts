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
