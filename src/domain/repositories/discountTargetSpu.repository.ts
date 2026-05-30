import { DiscountTargetSpuEntity } from "@domain/entities";
import { In } from "typeorm";

import { BaseRepository } from "./base";

export class DiscountTargetSpuRepository extends BaseRepository<DiscountTargetSpuEntity> {
    constructor() {
        super(DiscountTargetSpuEntity);
    }

    findSpuIdsByDiscount = async (discountId: string): Promise<string[]> => {
        const rows = await this.repository.find({
            select: { spuId: true },
            where: { discountId },
        });
        return rows.map((row) => row.spuId);
    };

    findSpuIdsByDiscountIds = async (
        discountIds: string[],
    ): Promise<Map<string, string[]>> => {
        if (discountIds.length === 0) return new Map();
        const rows = await this.repository.find({
            select: { discountId: true, spuId: true },
            where: { discountId: In(discountIds) },
        });
        const map = new Map<string, string[]>();
        for (const row of rows) {
            const list = map.get(row.discountId) ?? [];
            list.push(row.spuId);
            map.set(row.discountId, list);
        }
        return map;
    };
}

const discountTargetSpuRepository = new DiscountTargetSpuRepository();
export default discountTargetSpuRepository;
