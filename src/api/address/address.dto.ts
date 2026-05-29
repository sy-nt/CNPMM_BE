export interface AddressResponseDto {
    addressLine: string;
    city: string;
    country: string;
    district: string;
    id: string;
    isPrimary: boolean;
    name: string;
    state: string;
}

export interface CreateAddressRequestDto {
    addressLine: string;
    city: string;
    country: string;
    district: string;
    isPrimary?: boolean;
    name: string;
    shopId?: string;
    state: string;
    userId: string;
}

export type DeleteAddressRequestDto = {
    id: string;
    shopId?: string;
    userId: string;
};

export interface GetAddressesRequestDto {
    shopId?: string;
    userId: string;
}

export type GetAddressesResponseDto = AddressResponseDto[];

export type UpdateAddressRequestDto = {
    id: string;
    userId: string;
} & Partial<Omit<CreateAddressRequestDto, "userId">>;
