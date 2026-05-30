import { DeliveryStatus } from "@domain/entities";
import { DefaultPaginationDto, DefaultPaginationResponse } from "@shared/types";

export interface CreateDeliveryMethodRequestDto {
    code: string;
    description?: string;
    etaMaxDays: number;
    etaMinDays: number;
    isActive?: boolean;
    name: string;
    providerCode?: string;
}

export interface CreateDeliveryRateRequestDto {
    baseFee: string;
    deliveryMethodId: string;
    deliveryZoneId: string;
}

export interface CreateDeliveryRequestDto {
    deliveryMethodId: string;
    destinationAddressId: string;
    etaMaxDays: number;
    etaMinDays: number;
    fee: string;
    notes?: string;
    orderId?: string;
    warehouseId: string;
    zoneCode?: string;
}

export interface CreateDeliveryZoneRequestDto {
    code: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
    name: string;
}

export interface DeleteByIdRequestDto {
    id: string;
}

export interface DeliveryMethodResponseDto {
    code: string;
    description?: string;
    etaMaxDays: number;
    etaMinDays: number;
    id: string;
    isActive: boolean;
    name: string;
    providerCode: string;
}

export interface DeliveryQuoteMethodDto {
    code: string;
    etaMaxDays: number;
    etaMinDays: number;
    fee: string;
    methodId: string;
    name: string;
    providerCode: string;
    zoneCode?: string;
}

export interface DeliveryRateResponseDto {
    baseFee: string;
    deliveryMethodId: string;
    deliveryZoneId: string;
    id: string;
}

export interface DeliveryResponseDto {
    deliveryMethodId: string;
    destinationAddressId: string;
    etaMaxDays: number;
    etaMinDays: number;
    fee: string;
    id: string;
    notes?: string;
    orderId?: string;
    originAddressId: string;
    providerCode: string;
    status: DeliveryStatus;
    trackingCode?: string;
    zoneCode?: string;
}

export interface DeliveryZoneResponseDto {
    code: string;
    description?: string;
    displayOrder: number;
    id: string;
    isActive: boolean;
    name: string;
}

export interface GetDeliveriesRequestDto extends DefaultPaginationDto {
    callerRoleId?: string;
    callerShopId?: string;
    callerUserId?: string;
    status?: DeliveryStatus;
}

export type GetDeliveriesResponseDto =
    DefaultPaginationResponse<DeliveryResponseDto>;

export interface GetDeliveryRatesRequestDto extends DefaultPaginationDto {
    deliveryMethodId?: string;
    deliveryZoneId?: string;
}

export type GetDeliveryRatesResponseDto =
    DefaultPaginationResponse<DeliveryRateResponseDto>;

export interface GetDeliveryRequestDto {
    callerRoleId?: string;
    callerShopId?: string;
    callerUserId?: string;
    id: string;
}

export interface QuoteDeliveryRequestDto {
    addressId: string;
    callerUserId?: string;
    items: { quantity: number; skuId: string }[];
    warehouseId: string;
}

export interface QuoteDeliveryResponseDto {
    methods: DeliveryQuoteMethodDto[];
}

export interface UpdateDeliveryMethodRequestDto {
    code?: string;
    description?: string;
    etaMaxDays?: number;
    etaMinDays?: number;
    id: string;
    isActive?: boolean;
    name?: string;
    providerCode?: string;
}

export interface UpdateDeliveryRateRequestDto {
    baseFee?: string;
    id: string;
}

export interface UpdateDeliveryStatusRequestDto {
    callerRoleId?: string;
    callerShopId?: string;
    id: string;
    notes?: string;
    status: DeliveryStatus;
    trackingCode?: string;
}

export interface UpdateDeliveryZoneRequestDto {
    code?: string;
    description?: string;
    displayOrder?: number;
    id: string;
    isActive?: boolean;
    name?: string;
}
