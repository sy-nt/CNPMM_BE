import { DefaultPaginationDto, DefaultPaginationResponse } from "@shared/types";

export interface AdjustInventoryRequestDto {
    delta: number;
    expectedVersion?: number;
    shopId: string;
    skuId: string;
    warehouseId: string;
}

export interface GetInventoryBySkuRequestDto {
    shopId: string;
    skuId: string;
}

export type GetInventoryByWarehouseRequestDto = {
    shopId: string;
    warehouseId: string;
} & DefaultPaginationDto;

export type GetInventoryByWarehouseResponseDto =
    DefaultPaginationResponse<InventoryRowDto>;

export interface InventoryRowDto {
    quantity: number;
    reservedQuantity: number;
    skuId: string;
    updatedAt: Date;
    version: number;
    warehouseId: string;
}

export interface SetInventoryRequestDto {
    quantity: number;
    shopId: string;
    skuId: string;
    warehouseId: string;
}
