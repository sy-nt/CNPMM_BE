import { BadRequestError } from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";

import { ADDRESS_PUBLIC_SELECT, AddressError } from "../address.constants";
import {
    AddressResponseDto,
    CreateShopAddressRequestDto,
    DeleteShopAddressRequestDto,
    GetShopAddressesRequestDto,
    ListAddressesResponseDto,
    UpdateShopAddressRequestDto,
} from "../address.dto";
import { AddressBaseService } from "./address.base.service";

export class AddressShopService extends AddressBaseService {
    async createShopAddress(
        dto: CreateShopAddressRequestDto,
    ): Promise<AddressResponseDto> {
        if (dto.isPrimary) {
            await this.repositories.address.lockShopPrimary(dto.shopId);
            await this._clearShopPrimaries(dto.shopId);
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
            shopId: dto.shopId,
            state: dto.state,
            userId: dto.userId,
        });
        return this._toPublicResponse(address);
    }
    async deleteShopAddress(dto: DeleteShopAddressRequestDto): Promise<void> {
        const { id, shopId } = dto;
        const existing = await this.repositories.address.findOne({
            select: { id: true },
            where: { id, shopId },
        });
        if (!existing) {
            throw new BadRequestError(AddressError.ADDRESS_NOT_FOUND);
        }

        await this.repositories.address.softDelete({ id, shopId });
    }

    async getShopAddresses(
        dto: GetShopAddressesRequestDto,
    ): Promise<ListAddressesResponseDto> {
        const addresses = await this.repositories.address.find({
            select: ADDRESS_PUBLIC_SELECT,
            where: { shopId: dto.shopId },
        });
        return addresses.map((address) => this._toPublicResponse(address));
    }

    async updateShopAddress(dto: UpdateShopAddressRequestDto): Promise<void> {
        const { id, shopId, ...rest } = dto;
        const existing = await this.repositories.address.findOne({
            select: { id: true },
            where: { id, shopId },
        });
        if (!existing) {
            throw new BadRequestError(AddressError.ADDRESS_NOT_FOUND);
        }
        if (rest.isPrimary) {
            await this.repositories.address.lockShopPrimary(shopId);
            await this._clearShopPrimaries(shopId);
        }
        await this.repositories.address.update({ id, shopId }, removeNil(rest));
    }

    private async _clearShopPrimaries(shopId: string): Promise<void> {
        await this.repositories.address.update(
            { isPrimary: true, shopId },
            { isPrimary: false },
        );
    }
}

const addressShopService = new AddressShopService();
export { addressShopService };
