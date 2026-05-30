export interface AddressInputDto {
    addressLine: string;
    city: string;
    country: string;
    district: string;
    isPrimary?: boolean;
    latitude?: string;
    longitude?: string;
    name: string;
    state: string;
}

export interface AddressResponseDto {
    addressLine: string;
    city: string;
    country: string;
    district: string;
    id: string;
    isPrimary: boolean;
    latitude?: string;
    longitude?: string;
    name: string;
    state: string;
}

export interface CreatePersonalAddressRequestDto extends AddressInputDto {
    userId: string;
}

export interface CreateShopAddressRequestDto extends AddressInputDto {
    shopId: string;
    userId: string;
}

export type DeletePersonalAddressRequestDto = {
    id: string;
    userId: string;
};

export type DeleteShopAddressRequestDto = {
    id: string;
    shopId: string;
};

export interface GetPersonalAddressesRequestDto {
    userId: string;
}

export interface GetShopAddressesRequestDto {
    shopId: string;
}

export type ListAddressesResponseDto = AddressResponseDto[];

export type UpdatePersonalAddressRequestDto = {
    addressLine?: string;
    city?: string;
    country?: string;
    district?: string;
    id: string;
    isPrimary?: boolean;
    latitude?: string;
    longitude?: string;
    name?: string;
    state?: string;
    userId: string;
};

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
