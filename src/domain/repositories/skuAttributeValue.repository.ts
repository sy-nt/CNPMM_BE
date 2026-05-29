import { SkuAttributeValueEntity } from "@domain/entities";
import { In } from "typeorm";

import { BaseRepository } from "./base";

export class SkuAttributeValueRepository extends BaseRepository<SkuAttributeValueEntity> {
    constructor() {
        super(SkuAttributeValueEntity);
    }

    findBySku = async (skuId: string): Promise<SkuAttributeValueEntity[]> => {
        return this.repository.find({
            where: { skuId },
        });
    };

    findBySkuIds = async (
        skuIds: string[],
    ): Promise<SkuAttributeValueEntity[]> => {
        if (skuIds.length === 0) return [];
        return this.repository.find({
            where: { skuId: In(skuIds) },
        });
    };

    replaceForSku = async (
        skuId: string,
        rows: Array<{ attributeId: string; attributeValueId: string }>,
    ): Promise<void> => {
        const manager = await this._entityManager();
        await manager.delete(SkuAttributeValueEntity, { skuId });
        if (rows.length === 0) return;
        await manager.insert(
            SkuAttributeValueEntity,
            rows.map((row) => ({
                attributeId: row.attributeId,
                attributeValueId: row.attributeValueId,
                skuId,
            })),
        );
    };
}

const skuAttributeValueRepository = new SkuAttributeValueRepository();
export default skuAttributeValueRepository;
