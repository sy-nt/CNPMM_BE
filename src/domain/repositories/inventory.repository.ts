import { InventoryEntity } from "@domain/entities";
import { In } from "typeorm";

import { BaseRepository } from "./base";

export class InventoryRepository extends BaseRepository<InventoryEntity> {
    constructor() {
        super(InventoryEntity);
    }

    adjustWithGuard = async (params: {
        delta: number;
        expectedVersion?: number;
        skuId: string;
        warehouseId: string;
    }): Promise<number> => {
        const delta = Math.trunc(params.delta);
        const manager = await this._entityManager();
        const qb = manager
            .createQueryBuilder()
            .update(InventoryEntity)
            .set({
                quantity: () => "quantity + :delta",
                version: () => "version + 1",
            })
            .where("sku_id = :skuId", { skuId: params.skuId })
            .andWhere("warehouse_id = :warehouseId", {
                warehouseId: params.warehouseId,
            })
            .andWhere("quantity + :delta >= 0")
            .setParameter("delta", delta);
        if (params.expectedVersion !== undefined) {
            qb.andWhere("version = :version", {
                version: params.expectedVersion,
            });
        }
        const result = await qb.execute();
        return result.affected ?? 0;
    };

    findAvailableTotals = async (
        skuIds: string[],
    ): Promise<Map<string, number>> => {
        if (skuIds.length === 0) return new Map();
        const rows = await this.repository
            .createQueryBuilder("i")
            .select("i.sku_id", "skuId")
            .addSelect("SUM(i.quantity - i.reserved_quantity)", "available")
            .where("i.sku_id IN (:...skuIds)", { skuIds })
            .groupBy("i.sku_id")
            .getRawMany<{ available: null | string; skuId: string }>();
        return new Map(
            rows.map((row) => [row.skuId, Number(row.available ?? 0)]),
        );
    };

    findBySku = async (skuId: string): Promise<InventoryEntity[]> => {
        return this.repository.find({
            where: { skuId },
        });
    };

    findBySkuIds = async (skuIds: string[]): Promise<InventoryEntity[]> => {
        if (skuIds.length === 0) return [];
        return this.repository.find({
            where: { skuId: In(skuIds) },
        });
    };

    findOneByKey = async (
        skuId: string,
        warehouseId: string,
    ): Promise<InventoryEntity | null> => {
        return this.repository.findOne({
            where: { skuId, warehouseId },
        });
    };

    upsertQuantity = async (params: {
        quantity: number;
        skuId: string;
        warehouseId: string;
    }): Promise<void> => {
        const manager = await this._entityManager();
        const existing = await manager.findOne(InventoryEntity, {
            where: { skuId: params.skuId, warehouseId: params.warehouseId },
        });
        if (existing) {
            await manager
                .createQueryBuilder()
                .update(InventoryEntity)
                .set({
                    quantity: params.quantity,
                    version: () => "version + 1",
                })
                .where("sku_id = :skuId", { skuId: params.skuId })
                .andWhere("warehouse_id = :warehouseId", {
                    warehouseId: params.warehouseId,
                })
                .execute();
            return;
        }
        await manager.insert(InventoryEntity, {
            quantity: params.quantity,
            reservedQuantity: 0,
            skuId: params.skuId,
            warehouseId: params.warehouseId,
        });
    };
}

const inventoryRepository = new InventoryRepository();
export default inventoryRepository;
