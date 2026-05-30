import { DiscountEntity, DiscountScope, DiscountType } from "@domain/entities";

import { BaseRepository } from "./base";

export class DiscountRepository extends BaseRepository<DiscountEntity> {
    constructor() {
        super(DiscountEntity);
    }

    bumpUsedCount = async (discountId: string): Promise<number> => {
        const manager = await this._entityManager();
        const result = await manager
            .createQueryBuilder()
            .update(DiscountEntity)
            .set({ usedCount: () => "used_count + 1" })
            .where("id = :id", { id: discountId })
            .execute();
        return result.affected ?? 0;
    };

    decrementUsedCount = async (discountId: string): Promise<number> => {
        const manager = await this._entityManager();
        const result = await manager
            .createQueryBuilder()
            .update(DiscountEntity)
            .set({ usedCount: () => "used_count - 1" })
            .where("id = :id", { id: discountId })
            .andWhere("used_count > 0")
            .execute();
        return result.affected ?? 0;
    };

    findActiveByCode = async (code: string): Promise<DiscountEntity | null> => {
        return this.repository.findOne({
            where: { code, isActive: true },
        });
    };

    findActiveCandidates = async (params: {
        at: Date;
        discountType: DiscountType;
        scopes: DiscountScope[];
        shopIds?: string[];
    }): Promise<DiscountEntity[]> => {
        const qb = this.repository
            .createQueryBuilder("d")
            .where("d.discount_type = :discountType", {
                discountType: params.discountType,
            })
            .andWhere("d.is_active = :isActive", { isActive: true })
            .andWhere("(d.valid_from IS NULL OR d.valid_from <= :at)", {
                at: params.at,
            })
            .andWhere("(d.valid_until IS NULL OR d.valid_until >= :at)", {
                at: params.at,
            })
            .andWhere("d.scope IN (:...scopes)", { scopes: params.scopes });
        if (params.shopIds && params.shopIds.length > 0) {
            qb.andWhere(
                "(d.scope = :globalScope OR d.shop_id IN (:...shopIds))",
                {
                    globalScope: DiscountScope.GLOBAL,
                    shopIds: params.shopIds,
                },
            );
        } else {
            qb.andWhere("d.scope = :globalScope", {
                globalScope: DiscountScope.GLOBAL,
            });
        }
        return qb.getMany();
    };

    findOneAndLock = async (
        discountId: string,
    ): Promise<DiscountEntity | null> => {
        const manager = await this._entityManager();
        return manager
            .createQueryBuilder(DiscountEntity, "d")
            .setLock("pessimistic_write")
            .where("d.id = :id", { id: discountId })
            .getOne();
    };

    isCodeTaken = async (code: string): Promise<boolean> => {
        const count = await this.repository.count({
            where: { code },
            withDeleted: true,
        });
        return count > 0;
    };
}

const discountRepository = new DiscountRepository();
export default discountRepository;
