import { AddressInputDto } from "@api/address/address.dto";
import { ShopStatus } from "@domain/entities/shop.entity";
import { DefaultPaginationDto } from "@shared/types";

export type AdminGetShopsRequestDto = {
    status?: ShopStatus;
} & DefaultPaginationDto;

export type AssignWorkerRequestDto = {
    email: string;
    shopId: string;
};

export type GetShopsRequestDto = DefaultPaginationDto;

export type RegisterShopRequestDto = {
    addresses: AddressInputDto[];
    description?: string;
    imageKey?: string;
    name: string;
    ownerId: string;
};

export type ShopWorkerResponseDto = {
    assignedShopId?: null | string;
    email: string;
    firstName?: string;
    id: string;
    lastName?: string;
    role: {
        id: string;
        name: string;
    };
    roleId: string;
};

export type UnassignWorkerRequestDto = {
    email: string;
    shopId: string;
};

export type UpdateShopRequestDto = {
    id: string;
} & Partial<RegisterShopRequestDto>;

export type UpdateShopStatusRequestDto = {
    id: string;
    status: ShopStatus;
};
