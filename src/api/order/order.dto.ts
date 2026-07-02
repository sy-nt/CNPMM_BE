import {
    DestinationAddressSnapshot,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    WarehouseAllocationEntry,
} from "@domain/entities";
import { DefaultPaginationDto, DefaultPaginationResponse } from "@shared/types";

import { AppliedDiscount, CheckoutPreviewBundle } from "./order.type";

export interface CancelOrderRequestDto {
    callerShopId?: string;
    callerUserId?: string;
    id: string;
    reason?: string;
}

export interface CheckoutItemSelectionDto {
    quantity?: number;
    skuId: string;
}

export interface CheckoutPreviewRequestDto {
    callerUserId: string;
    claimedDiscountIds?: string[];
    deliveryMethodId: string;
    destinationAddressId: string;
    items: CheckoutItemSelectionDto[];
}

export interface CheckoutPreviewResponseDto {
    bundles: CheckoutPreviewBundle[];
    grandTotal: string;
}

export interface GetOrderRequestDto {
    callerRoleId?: string;
    callerShopId?: string;
    callerUserId?: string;
    id: string;
}

export interface GetOrdersRequestDto extends DefaultPaginationDto {
    callerRoleId?: string;
    callerShopId?: string;
    callerUserId?: string;
    shopId?: string;
    status?: OrderStatus;
}

export type GetOrdersResponseDto = DefaultPaginationResponse<OrderResponseDto>;

export interface OrderItemResponseDto {
    id: string;
    imageKeySnapshot?: string;
    nameSnapshot: string;
    quantity: number;
    skuId: string;
    spuIdSnapshot: string;
    subtotal: string;
    unitPriceSnapshot: string;
    warehouseAllocation: WarehouseAllocationEntry[];
}

export interface OrderResponseDto {
    appliedDiscounts: {
        delivery?: AppliedDiscount;
        items?: AppliedDiscount;
    };
    cancellationReason?: string;
    cancelledAt?: Date;
    createdAt: Date;
    deliveryFee: string;
    deliveryId?: string;
    destinationAddressId: string;
    destinationAddressSnapshot: DestinationAddressSnapshot;
    id: string;
    items: OrderItemResponseDto[];
    itemsSubtotal: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    shopId: string;
    status: OrderStatus;
    totalAmount: string;
    userId: string;
}

export interface PlaceOrderRequestDto {
    callerUserId: string;
    claimedDiscountIds?: string[];
    deliveryMethodId: string;
    destinationAddressId: string;
    expectedTotalAmount: string;
    items: CheckoutItemSelectionDto[];
}

export interface PlaceOrderResponseDto {
    bundles: CheckoutPreviewBundle[];
    grandTotal: string;
    orders: OrderResponseDto[];
}

export interface UpdateOrderStatusRequestDto {
    callerRoleId?: string;
    callerShopId?: string;
    id: string;
    status: OrderStatus;
}
