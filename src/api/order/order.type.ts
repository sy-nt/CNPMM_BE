export interface AppliedDiscount {
    amount: string;
    code?: string;
    discountId: string;
}

export interface CartLineHydrated {
    imageKey?: string;
    name: string;
    quantity: number;
    shopId: string;
    skuId: string;
    spuId: string;
    unitPrice: string;
}

export interface CheckoutPreviewBundle {
    bundle: PerShopBundle;
    delivery: {
        deliveryMethodId: string;
        etaMaxDays: number;
        etaMinDays: number;
        fee: string;
        originWarehouseId: string;
        providerCode: string;
        zoneCode?: string;
    };
    discounts: {
        deliveryDiscount?: AppliedDiscount;
        itemsDiscount?: AppliedDiscount;
    };
    totalAmount: string;
    warehouseAllocation: WarehouseAllocation;
}

export interface PerShopBundle {
    items: CartLineHydrated[];
    itemsSubtotal: string;
    shopId: string;
}

export interface WarehouseAllocation {
    perItem: WarehouseAllocationPerItem[];
    pickedOriginWarehouseId: string;
}

export interface WarehouseAllocationPerItem {
    allocations: { quantity: number; warehouseId: string }[];
    skuId: string;
}
