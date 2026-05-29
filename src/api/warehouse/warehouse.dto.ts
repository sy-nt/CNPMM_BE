import { DefaultPaginationDto, DefaultPaginationResponse } from "@shared/types";

export interface CreateWarehouseRequestDto {
    addressId: string;
    code: string;
    isActive?: boolean;
    isDefault?: boolean;
    name: string;
    shopId: string;
}

export interface DeleteWarehouseRequestDto {
    id: string;
    shopId: string;
}

export interface GetWarehouseRequestDto {
    id: string;
    shopId: string;
}

export type GetWarehousesRequestDto = {
    shopId: string;
} & DefaultPaginationDto;

export type GetWarehousesResponseDto =
    DefaultPaginationResponse<WarehouseResponseDto>;

export interface UpdateWarehouseRequestDto {
    addressId?: string;
    code?: string;
    id: string;
    isActive?: boolean;
    isDefault?: boolean;
    name?: string;
    shopId: string;
}

export interface WarehouseResponseDto {
    addressId: string;
    code: string;
    id: string;
    isActive: boolean;
    isDefault: boolean;
    name: string;
}
