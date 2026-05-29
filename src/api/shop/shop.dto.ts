import { CreateAddressRequestDto } from "@api/address/address.dto";
import { ShopStatus } from "@domain/entities/shop.entity";
import { DefaultPaginationDto } from "@shared/types";

export type AssignWorkerRequestDto = {
    email: string;
    shopId: string;
    shopOwnerId: string;
};

export type GetShopsRequestDto = DefaultPaginationDto;

export type RegisterShopRequestDto = {
    addresses: CreateAddressRequestDto[];
    description?: string;
    name: string;
    ownerId: string;
};

export type UpdateShopRequestDto = {
    id: string;
} & Partial<RegisterShopRequestDto>;

export type UpdateShopStatusRequestDto = {
    id: string;
    status: ShopStatus;
};
