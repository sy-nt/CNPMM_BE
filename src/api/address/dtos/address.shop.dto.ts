import type {
    AddressInputDto,
    ListAddressesResponseDto,
} from "./address.base.dto";

export interface CreateShopAddressRequestDto extends AddressInputDto {
    shopId: string;
    userId: string;
}

export type DeleteShopAddressRequestDto = {
    id: string;
    shopId: string;
};

export interface GetShopAddressesRequestDto {
    shopId: string;
}

export type UpdateShopAddressRequestDto = {
    addressLine?: string;
    city?: string;
    country?: string;
    district?: string;
    id: string;
    isPrimary?: boolean;
    latitude?: string;
    longitude?: string;
    name?: string;
    shopId: string;
    state?: string;
};

export type { ListAddressesResponseDto };
