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
    DefaultPaginationResponse<InventoryWarehouseRowDto>;

export interface InventoryProductDto {
    categoryId: string;
    id: string;
    isActive: boolean;
    mainImageKey?: string;
    mainImageUrl?: string;
    name: string;
    price: string;
    shopId: string;
    slug: string;
    soldCount: number;
}

export interface InventoryRowDto {
    quantity: number;
    reservedQuantity: number;
    skuId: string;
    updatedAt: Date;
    version: number;
    warehouseId: string;
}

export interface InventorySkuDto {
    id: string;
    imageKey?: string;
    imageUrl?: string;
    isActive: boolean;
    name?: string;
    price?: string;
    skuCode: string;
    spuId: string;
}

export interface InventoryWarehouseRowDto extends InventoryRowDto {
    product: InventoryProductDto;
    sku: InventorySkuDto;
}

export interface SetInventoryRequestDto {
    quantity: number;
    shopId: string;
    skuId: string;
    warehouseId: string;
}
