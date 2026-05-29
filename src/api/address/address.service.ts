import { BaseService } from "@shared/lib/base/service";
import { ForbiddenError, NotFoundError } from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import { IsNull } from "typeorm";

import { AddressError } from "./address.constants";
import {
    CreateAddressRequestDto,
    DeleteAddressRequestDto,
    GetAddressesRequestDto,
    GetAddressesResponseDto,
    UpdateAddressRequestDto,
} from "./address.dto";

export class AddressService extends BaseService {
    async createAddress(dto: CreateAddressRequestDto): Promise<void> {
        await this._validateAddress(dto);
        if (dto.shopId) {
            await this._ensureShopOwnership(dto.shopId, dto.userId);
        }
        if (dto.isPrimary) {
            await this._clearOtherPrimaries(dto.userId, dto.shopId);
        }
        await this.repositories.address.create(dto);
    }

    async deleteAddress(dto: DeleteAddressRequestDto): Promise<void> {
        const result = await this.repositories.address.delete(removeNil(dto));
        if (!result.affected) {
            throw new NotFoundError(AddressError.ADDRESS_NOT_FOUND);
        }
    }

    async getAddresses(
        dto: GetAddressesRequestDto,
    ): Promise<GetAddressesResponseDto> {
        return this.repositories.address.find({
            select: {
                addressLine: true,
                city: true,
                country: true,
                district: true,
                id: true,
                isPrimary: true,
                name: true,
                state: true,
            },
            where: {
                ...removeNil({
                    shopId: dto.shopId,
                    userId: dto.userId,
                }),
            },
        });
    }

    async updateAddress(dto: UpdateAddressRequestDto): Promise<void> {
        const { id, shopId, userId, ...rest } = dto;
        await this._validateAddress(dto);
        if (shopId) {
            await this._ensureShopOwnership(shopId, userId);
        }
        if (rest.isPrimary) {
            await this._clearOtherPrimaries(userId, shopId);
        }
        await this.repositories.address.update(
            removeNil({ id, shopId, userId }),
            removeNil(rest),
        );
    }

    private async _clearOtherPrimaries(
        userId: string,
        shopId?: string,
    ): Promise<void> {
        await this.repositories.address.update(
            {
                isPrimary: true,
                shopId: shopId ?? IsNull(),
                userId,
            },
            { isPrimary: false },
        );
    }

    private async _ensureShopOwnership(
        shopId: string,
        userId: string,
    ): Promise<void> {
        const user = await this.repositories.user.findOne({
            where: {
                id: userId,
            },
        });
        if (!user || user.assignedShopId !== shopId)
            throw new ForbiddenError(AddressError.SHOP_NOT_OWNED);
    }

    private async _validateAddress(
        _dto: CreateAddressRequestDto | UpdateAddressRequestDto,
    ): Promise<void> {
        // TODO: Using third party API to validate address
    }
}

const addressService = new AddressService();
export default addressService;
