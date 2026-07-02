import { BadRequestError } from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import { IsNull } from "typeorm";

import { ADDRESS_PUBLIC_SELECT, AddressError } from "../address.constants";
import {
    AddressResponseDto,
    CreatePersonalAddressRequestDto,
    DeletePersonalAddressRequestDto,
    GetPersonalAddressesRequestDto,
    ListAddressesResponseDto,
    UpdatePersonalAddressRequestDto,
} from "../address.dto";
import { AddressBaseService } from "./address.base.service";

export class AddressPublicService extends AddressBaseService {
    async createPersonalAddress(
        dto: CreatePersonalAddressRequestDto,
    ): Promise<AddressResponseDto> {
        if (dto.isPrimary) {
            await this.repositories.address.lockPersonalPrimary(dto.userId);
            await this._clearPersonalPrimaries(dto.userId);
        }
        const address = await this.repositories.address.create({
            addressLine: dto.addressLine,
            city: dto.city,
            country: dto.country,
            district: dto.district,
            isPrimary: dto.isPrimary,
            latitude: dto.latitude,
            longitude: dto.longitude,
            name: dto.name,
            state: dto.state,
            userId: dto.userId,
        });

        return this._toPublicResponse(address);
    }

    async deletePersonalAddress(
        dto: DeletePersonalAddressRequestDto,
    ): Promise<void> {
        const { id, userId } = dto;
        const existing = await this.repositories.address.findOne({
            select: { id: true },
            where: { id, shopId: IsNull(), userId },
        });
        if (!existing) {
            throw new BadRequestError(AddressError.ADDRESS_NOT_FOUND);
        }

        await this.repositories.address.softDelete({
            id,
            shopId: IsNull(),
            userId,
        });
    }

    async getPersonalAddresses(
        dto: GetPersonalAddressesRequestDto,
    ): Promise<ListAddressesResponseDto> {
        return this.repositories.address.find({
            select: ADDRESS_PUBLIC_SELECT,
            where: { shopId: IsNull(), userId: dto.userId },
        });
    }

    async updatePersonalAddress(
        dto: UpdatePersonalAddressRequestDto,
    ): Promise<void> {
        const { id, userId, ...rest } = dto;
        const existing = await this.repositories.address.findOne({
            select: { id: true },
            where: { id, shopId: IsNull(), userId },
        });
        if (!existing) {
            throw new BadRequestError(AddressError.ADDRESS_NOT_FOUND);
        }

        if (rest.isPrimary) {
            await this.repositories.address.lockPersonalPrimary(userId);
            await this._clearPersonalPrimaries(userId);
        }

        await this.repositories.address.update(
            { id, shopId: IsNull(), userId },
            removeNil(rest),
        );
    }

    private async _clearPersonalPrimaries(userId: string): Promise<void> {
        await this.repositories.address.update(
            { isPrimary: true, shopId: IsNull(), userId },
            { isPrimary: false },
        );
    }
}

const addressPublicService = new AddressPublicService();
export { addressPublicService };
