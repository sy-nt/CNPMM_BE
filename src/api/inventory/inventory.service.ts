import {
    loadImageUrlLookup,
    resolveImageUrl,
} from "@api/image/image.lifecycle";
import { InventoryEntity, SkuEntity, SpuEntity } from "@domain/entities";
import { BaseService } from "@shared/lib/base/service";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@shared/lib/http/httpError";

import { InventoryError } from "./inventory.constants";
import {
    AdjustInventoryRequestDto,
    GetInventoryBySkuRequestDto,
    GetInventoryByWarehouseRequestDto,
    GetInventoryByWarehouseResponseDto,
    InventoryProductDto,
    InventoryRowDto,
    InventorySkuDto,
    InventoryWarehouseRowDto,
    SetInventoryRequestDto,
} from "./inventory.dto";

export class InventoryService extends BaseService {
    async adjustInventory(
        dto: AdjustInventoryRequestDto,
    ): Promise<InventoryRowDto> {
        await this._assertSkuOwnedByShop(dto.skuId, dto.shopId);
        await this._assertWarehouseOwnedByShop(dto.warehouseId, dto.shopId);
        const existing = await this.repositories.inventory.findOneByKey(
            dto.skuId,
            dto.warehouseId,
        );
        if (!existing) {
            throw new NotFoundError(InventoryError.INVENTORY_NOT_FOUND);
        }
        const affected = await this.repositories.inventory.adjustWithGuard({
            delta: dto.delta,
            expectedVersion: dto.expectedVersion,
            skuId: dto.skuId,
            warehouseId: dto.warehouseId,
        });
        if (affected === 0) {
            this._classifyAdjustFailure(existing, dto);
        }
        const updated = await this.repositories.inventory.findOneByKey(
            dto.skuId,
            dto.warehouseId,
        );
        return this._toRow(updated!);
    }

    async getInventoryBySku(
        dto: GetInventoryBySkuRequestDto,
    ): Promise<InventoryRowDto[]> {
        await this._assertSkuOwnedByShop(dto.skuId, dto.shopId);
        const rows = await this.repositories.inventory.findBySku(dto.skuId);
        return rows.map((row) => this._toRow(row));
    }

    async getInventoryByWarehouse(
        dto: GetInventoryByWarehouseRequestDto,
    ): Promise<GetInventoryByWarehouseResponseDto> {
        await this._assertWarehouseOwnedByShop(dto.warehouseId, dto.shopId);
        const { shopId: _shopId, warehouseId, ...pagination } = dto;
        const result = await this.repositories.inventory.paginate(
            { where: { warehouseId } },
            pagination,
        );
        const skuIds = [...new Set(result.items.map((row) => row.skuId))];
        const skus = await this.repositories.sku.findByIdsWithSpu(skuIds);
        const skuById = new Map(skus.map((sku) => [sku.id, sku]));
        const imageLookup = await loadImageUrlLookup(
            this.repositories.image,
            skus.flatMap((sku) => [sku.imageKey, sku.spu?.mainImageKey]),
        );
        return {
            ...result,
            items: result.items.map((row) =>
                this._toWarehouseRow(row, skuById, imageLookup),
            ),
        };
    }

    async setInventory(dto: SetInventoryRequestDto): Promise<InventoryRowDto> {
        await this._assertSkuOwnedByShop(dto.skuId, dto.shopId);
        await this._assertWarehouseOwnedByShop(dto.warehouseId, dto.shopId);
        await this.repositories.inventory.upsertQuantity({
            quantity: dto.quantity,
            skuId: dto.skuId,
            warehouseId: dto.warehouseId,
        });
        const refreshed = await this.repositories.inventory.findOneByKey(
            dto.skuId,
            dto.warehouseId,
        );
        return this._toRow(refreshed!);
    }

    private async _assertSkuOwnedByShop(
        skuId: string,
        shopId: string,
    ): Promise<void> {
        const sku = await this.repositories.sku.findOne({
            select: { id: true, spuId: true },
            where: { id: skuId },
        });
        if (!sku) {
            throw new NotFoundError(InventoryError.SKU_NOT_FOUND);
        }
        const spu = await this.repositories.spu.findOne({
            select: { id: true, shopId: true },
            where: { id: sku.spuId },
        });
        if (!spu || spu.shopId !== shopId) {
            throw new ForbiddenError(InventoryError.SKU_NOT_OWNED);
        }
    }

    private async _assertWarehouseOwnedByShop(
        warehouseId: string,
        shopId: string,
    ): Promise<void> {
        const warehouse = await this.repositories.warehouse.findOne({
            select: { id: true, shopId: true },
            where: { id: warehouseId },
        });
        if (!warehouse) {
            throw new NotFoundError(InventoryError.WAREHOUSE_NOT_FOUND);
        }
        if (warehouse.shopId !== shopId) {
            throw new ForbiddenError(InventoryError.WAREHOUSE_NOT_OWNED);
        }
    }

    private _classifyAdjustFailure(
        existing: InventoryEntity,
        dto: AdjustInventoryRequestDto,
    ): never {
        if (
            dto.expectedVersion !== undefined &&
            dto.expectedVersion !== existing.version
        ) {
            throw new ConflictError(InventoryError.INVENTORY_CONCURRENT_UPDATE);
        }
        if (existing.quantity + dto.delta < 0) {
            throw new BadRequestError(InventoryError.QUANTITY_BELOW_ZERO);
        }
        throw new ConflictError(InventoryError.INVENTORY_CONCURRENT_UPDATE);
    }

    private _toProductDto(
        product: SpuEntity,
        imageLookup: Map<string, string>,
    ): InventoryProductDto {
        return {
            categoryId: product.categoryId,
            id: product.id,
            isActive: product.isActive,
            mainImageKey: product.mainImageKey,
            mainImageUrl: resolveImageUrl(product.mainImageKey, imageLookup),
            name: product.name,
            price: product.price,
            shopId: product.shopId,
            slug: product.slug,
            soldCount: product.soldCount,
        };
    }

    private _toRow(entity: InventoryEntity): InventoryRowDto {
        return {
            quantity: entity.quantity,
            reservedQuantity: entity.reservedQuantity,
            skuId: entity.skuId,
            updatedAt: entity.updatedAt,
            version: entity.version,
            warehouseId: entity.warehouseId,
        };
    }

    private _toSkuDto(
        sku: SkuEntity,
        imageLookup: Map<string, string>,
    ): InventorySkuDto {
        return {
            id: sku.id,
            imageKey: sku.imageKey,
            imageUrl: resolveImageUrl(sku.imageKey, imageLookup),
            isActive: sku.isActive,
            name: sku.name,
            price: sku.price,
            skuCode: sku.skuCode,
            spuId: sku.spuId,
        };
    }

    private _toWarehouseRow(
        entity: InventoryEntity,
        skuById: Map<string, SkuEntity>,
        imageLookup: Map<string, string>,
    ): InventoryWarehouseRowDto {
        const sku = skuById.get(entity.skuId);
        if (!sku?.spu) {
            throw new NotFoundError(InventoryError.SKU_NOT_FOUND);
        }
        return {
            ...this._toRow(entity),
            product: this._toProductDto(sku.spu, imageLookup),
            sku: this._toSkuDto(sku, imageLookup),
        };
    }
}

const inventoryService = new InventoryService();
export default inventoryService;
