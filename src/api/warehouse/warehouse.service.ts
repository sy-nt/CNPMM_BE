import { WarehouseEntity } from "@domain/entities";
import { BaseService } from "@shared/lib/base/service";
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import { Not } from "typeorm";

import { WarehouseError } from "./warehouse.constants";
import {
    CreateWarehouseRequestDto,
    DeleteWarehouseRequestDto,
    GetWarehouseRequestDto,
    GetWarehousesRequestDto,
    GetWarehousesResponseDto,
    UpdateWarehouseRequestDto,
    WarehouseResponseDto,
} from "./warehouse.dto";

export class WarehouseService extends BaseService {
    async createWarehouse(
        dto: CreateWarehouseRequestDto,
    ): Promise<WarehouseResponseDto> {
        await this._ensureAddressOwnedByShop(dto.addressId, dto.shopId);
        await this._ensureAddressNotUsed(dto.addressId);
        await this._ensureCodeUniqueInShop(dto.code, dto.shopId);
        if (dto.isDefault) {
            await this._clearOtherDefaults(dto.shopId);
        }
        const created = await this.repositories.warehouse.create({
            addressId: dto.addressId,
            code: dto.code,
            isActive: dto.isActive ?? true,
            isDefault: dto.isDefault ?? false,
            name: dto.name,
            shopId: dto.shopId,
        });
        return this._toResponse(created);
    }

    async deleteWarehouse(dto: DeleteWarehouseRequestDto): Promise<void> {
        await this._getWarehouseOrThrow(dto.id, dto.shopId);
        await this.repositories.warehouse.softDelete({
            id: dto.id,
            shopId: dto.shopId,
        });
    }

    async getWarehouse(
        dto: GetWarehouseRequestDto,
    ): Promise<WarehouseResponseDto> {
        const warehouse = await this._getWarehouseOrThrow(dto.id, dto.shopId);
        return this._toResponse(warehouse);
    }

    async getWarehouses(
        dto: GetWarehousesRequestDto,
    ): Promise<GetWarehousesResponseDto> {
        const { shopId, ...pagination } = dto;
        const result = await this.repositories.warehouse.paginate(
            {
                where: { shopId },
            },
            pagination,
        );
        return {
            ...result,
            items: result.items.map((item) => this._toResponse(item)),
        };
    }

    async updateWarehouse(
        dto: UpdateWarehouseRequestDto,
    ): Promise<WarehouseResponseDto> {
        const target = await this._getWarehouseOrThrow(dto.id, dto.shopId);
        await this._validateUpdates(dto, target);
        if (dto.isDefault) {
            await this._clearOtherDefaults(dto.shopId, dto.id);
        }
        const { id, shopId: _shopId, ...rest } = dto;
        const updates = removeNil(rest);
        if (Object.keys(updates).length === 0) {
            return this._toResponse(target);
        }
        await this.repositories.warehouse.update(
            { id, shopId: dto.shopId },
            updates,
        );
        const refreshed = await this._getWarehouseOrThrow(id, dto.shopId);
        return this._toResponse(refreshed);
    }

    private async _clearOtherDefaults(
        shopId: string,
        ignoreId?: string,
    ): Promise<void> {
        await this.repositories.warehouse.update(
            removeNil({
                id: ignoreId ? Not(ignoreId) : undefined,
                isDefault: true,
                shopId,
            }),
            { isDefault: false },
        );
    }

    private async _ensureAddressNotUsed(
        addressId: string,
        ignoreWarehouseId?: string,
    ): Promise<void> {
        const existing = await this.repositories.warehouse.findOne({
            select: { deletedAt: true, id: true },
            where: { addressId },
            withDeleted: true,
        });
        if (!existing || existing.id === ignoreWarehouseId) return;
        throw new ConflictError(
            existing.deletedAt
                ? WarehouseError.ADDRESS_ALREADY_USED_BY_DELETED
                : WarehouseError.ADDRESS_ALREADY_USED,
        );
    }

    private async _ensureAddressOwnedByShop(
        addressId: string,
        shopId: string,
    ): Promise<void> {
        const address = await this.repositories.address.findOne({
            select: { id: true, shopId: true },
            where: { id: addressId },
        });
        if (!address) {
            throw new NotFoundError(WarehouseError.ADDRESS_NOT_FOUND);
        }
        if (address.shopId !== shopId) {
            throw new ForbiddenError(WarehouseError.ADDRESS_NOT_OWNED);
        }
    }

    private async _ensureCodeUniqueInShop(
        code: string,
        shopId: string,
        ignoreWarehouseId?: string,
    ): Promise<void> {
        const existing = await this.repositories.warehouse.findOne({
            select: { deletedAt: true, id: true },
            where: { code, shopId },
            withDeleted: true,
        });
        if (!existing || existing.id === ignoreWarehouseId) return;
        throw new ConflictError(
            existing.deletedAt
                ? WarehouseError.WAREHOUSE_CODE_ALREADY_EXISTS_DELETED
                : WarehouseError.WAREHOUSE_CODE_ALREADY_EXISTS,
        );
    }

    private async _getWarehouseOrThrow(
        id: string,
        shopId: string,
    ): Promise<WarehouseEntity> {
        const warehouse = await this.repositories.warehouse.findOne({
            where: { id, shopId },
        });
        if (!warehouse) {
            throw new NotFoundError(WarehouseError.WAREHOUSE_NOT_FOUND);
        }
        return warehouse;
    }

    private _toResponse(warehouse: WarehouseEntity): WarehouseResponseDto {
        return {
            addressId: warehouse.addressId,
            code: warehouse.code,
            id: warehouse.id,
            isActive: warehouse.isActive,
            isDefault: warehouse.isDefault,
            name: warehouse.name,
        };
    }

    private async _validateUpdates(
        dto: UpdateWarehouseRequestDto,
        target: WarehouseEntity,
    ): Promise<void> {
        if (dto.addressId && dto.addressId !== target.addressId) {
            await this._ensureAddressOwnedByShop(dto.addressId, dto.shopId);
            await this._ensureAddressNotUsed(dto.addressId, dto.id);
        }
        if (dto.code && dto.code !== target.code) {
            await this._ensureCodeUniqueInShop(dto.code, dto.shopId, dto.id);
        }
    }
}

const warehouseService = new WarehouseService();
export default warehouseService;
