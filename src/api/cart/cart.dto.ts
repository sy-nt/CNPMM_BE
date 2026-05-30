import { CartItemUnavailableReason } from "./cart.type";

export interface AddItemRequestDto {
    quantity: number;
    skuId: string;
    userId: string;
}

export interface CartItemResponseDto {
    id?: string;
    isAvailable: boolean;
    quantity: number;
    reason?: CartItemUnavailableReason;
    sku: CartItemSkuSummaryDto;
    skuId: string;
    subtotal: string;
}

export interface CartItemShopSummaryDto {
    id: string;
    name: string;
    slug: string;
    status: string;
}

export interface CartItemSkuSummaryDto {
    availableQuantity: number;
    id: string;
    imageKey?: string;
    isActive: boolean;
    name?: string;
    price?: string;
    shop?: CartItemShopSummaryDto;
    spuId?: string;
}

export interface CartResponseDto {
    id?: string;
    items: CartItemResponseDto[];
    total: string;
    unavailableCount: number;
    updatedAt?: Date;
    userId: string;
}

export interface ClearCartRequestDto {
    userId: string;
}

export interface GetCartRequestDto {
    userId: string;
}

export interface RemoveItemRequestDto {
    skuId: string;
    userId: string;
}

export interface UpdateItemRequestDto {
    quantity: number;
    skuId: string;
    userId: string;
}
