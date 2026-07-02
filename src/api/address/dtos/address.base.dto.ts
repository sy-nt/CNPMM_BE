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

export type ListAddressesResponseDto = AddressResponseDto[];
