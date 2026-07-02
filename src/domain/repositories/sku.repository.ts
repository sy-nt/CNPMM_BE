import { SkuEntity } from "@domain/entities";
import { In, QueryDeepPartialEntity } from "typeorm";

import { BaseRepository } from "./base";

export class SkuRepository extends BaseRepository<SkuEntity> {
    constructor() {
        super(SkuEntity);
    }

    existsBySpu = async (spuId: string): Promise<boolean> => {
        const count = await this.repository.count({
            where: { spuId },
        });
        return count > 0;
    };

    findByCodes = async (codes: string[]): Promise<SkuEntity[]> => {
        if (codes.length === 0) return [];
        return this.repository.find({
            select: { id: true, skuCode: true },
            where: { skuCode: In(codes) },
            withDeleted: true,
        });
    };

    findByIdsWithSpu = async (ids: string[]): Promise<SkuEntity[]> => {
        if (ids.length === 0) return [];
        return this.repository.find({
            relations: { spu: true },
            select: {
                id: true,
                imageKey: true,
                isActive: true,
                name: true,
                price: true,
                skuCode: true,
                spu: {
                    categoryId: true,
                    id: true,
                    isActive: true,
                    mainImageKey: true,
                    name: true,
                    price: true,
                    shopId: true,
                    slug: true,
                    soldCount: true,
                },
                spuId: true,
            },
            where: { id: In(ids) },
        });
    };

    findBySpu = async (spuId: string): Promise<SkuEntity[]> => {
        return this.repository.find({
            where: { spuId },
        });
    };

    updateWithGuard = async (params: {
        expectedVersion: number;
        id: string;
        partial: QueryDeepPartialEntity<SkuEntity>;
    }): Promise<number> => {
        const manager = await this._entityManager();
        const result = await manager
            .createQueryBuilder()
            .update(SkuEntity)
            .set({
                ...params.partial,
                version: () => "version + 1",
            })
            .where("id = :id", { id: params.id })
            .andWhere("version = :version", {
                version: params.expectedVersion,
            })
            .execute();
        return result.affected ?? 0;
    };
}

const skuRepository = new SkuRepository();
export default skuRepository;
