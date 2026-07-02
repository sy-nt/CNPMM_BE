import type {
    AddressInputDto,
    ListAddressesResponseDto,
} from "./address.base.dto";

export interface CreatePersonalAddressRequestDto extends AddressInputDto {
    userId: string;
}

export type DeletePersonalAddressRequestDto = {
    id: string;
    userId: string;
};

export interface GetPersonalAddressesRequestDto {
    userId: string;
}

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

export type { ListAddressesResponseDto };
