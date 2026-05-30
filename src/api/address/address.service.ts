import { BaseService } from "@shared/lib/base/service";
import { NotFoundError } from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import { IsNull } from "typeorm";

import { ADDRESS_PUBLIC_SELECT, AddressError } from "./address.constants";
import {
    CreatePersonalAddressRequestDto,
    CreateShopAddressRequestDto,
    DeletePersonalAddressRequestDto,
    DeleteShopAddressRequestDto,
    GetPersonalAddressesRequestDto,
    GetShopAddressesRequestDto,
    ListAddressesResponseDto,
    UpdatePersonalAddressRequestDto,
    UpdateShopAddressRequestDto,
} from "./address.dto";

export class AddressService extends BaseService {
    async createPersonalAddress(
        dto: CreatePersonalAddressRequestDto,
    ): Promise<void> {
        if (dto.isPrimary) {
            await this.repositories.address.lockPersonalPrimary(dto.userId);
            await this._clearPersonalPrimaries(dto.userId);
        }
        await this.repositories.address.create({
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
    }

    async createShopAddress(dto: CreateShopAddressRequestDto): Promise<void> {
        if (dto.isPrimary) {
            await this.repositories.address.lockShopPrimary(dto.shopId);
            await this._clearShopPrimaries(dto.shopId);
        }
        await this.repositories.address.create({
            addressLine: dto.addressLine,
            city: dto.city,
            country: dto.country,
            district: dto.district,
            isPrimary: dto.isPrimary,
            latitude: dto.latitude,
            longitude: dto.longitude,
            name: dto.name,
            shopId: dto.shopId,
            state: dto.state,
            userId: dto.userId,
        });
    }

    async deletePersonalAddress(
        dto: DeletePersonalAddressRequestDto,
    ): Promise<void> {
        const result = await this.repositories.address.softDelete({
            id: dto.id,
            shopId: IsNull(),
            userId: dto.userId,
        });
        if (!result.affected) {
            throw new NotFoundError(AddressError.ADDRESS_NOT_FOUND);
        }
    }

    async deleteShopAddress(dto: DeleteShopAddressRequestDto): Promise<void> {
        const result = await this.repositories.address.softDelete({
            id: dto.id,
            shopId: dto.shopId,
        });
        if (!result.affected) {
            throw new NotFoundError(AddressError.ADDRESS_NOT_FOUND);
        }
    }

    async getPersonalAddresses(
        dto: GetPersonalAddressesRequestDto,
    ): Promise<ListAddressesResponseDto> {
        return this.repositories.address.find({
            select: ADDRESS_PUBLIC_SELECT,
            where: { shopId: IsNull(), userId: dto.userId },
        });
    }

    async getShopAddresses(
        dto: GetShopAddressesRequestDto,
    ): Promise<ListAddressesResponseDto> {
        return this.repositories.address.find({
            select: ADDRESS_PUBLIC_SELECT,
            where: { shopId: dto.shopId },
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
            throw new NotFoundError(AddressError.ADDRESS_NOT_FOUND);
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

    async updateShopAddress(dto: UpdateShopAddressRequestDto): Promise<void> {
        const { id, shopId, ...rest } = dto;
        const existing = await this.repositories.address.findOne({
            select: { id: true },
            where: { id, shopId },
        });
        if (!existing) {
            throw new NotFoundError(AddressError.ADDRESS_NOT_FOUND);
        }
        if (rest.isPrimary) {
            await this.repositories.address.lockShopPrimary(shopId);
            await this._clearShopPrimaries(shopId);
        }
        await this.repositories.address.update({ id, shopId }, removeNil(rest));
    }

    private async _clearPersonalPrimaries(userId: string): Promise<void> {
        await this.repositories.address.update(
            { isPrimary: true, shopId: IsNull(), userId },
            { isPrimary: false },
        );
    }

    private async _clearShopPrimaries(shopId: string): Promise<void> {
        await this.repositories.address.update(
            { isPrimary: true, shopId },
            { isPrimary: false },
        );
    }
}

const addressService = new AddressService();
export default addressService;
