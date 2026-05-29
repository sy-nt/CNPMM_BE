import { ProductAttributeEntity } from "@domain/entities";
import { In } from "typeorm";

import { BaseRepository } from "./base";

export class ProductAttributeRepository extends BaseRepository<ProductAttributeEntity> {
    constructor() {
        super(ProductAttributeEntity);
    }

    findByIdsForSpu = async (
        ids: string[],
        spuId: string,
    ): Promise<ProductAttributeEntity[]> => {
        if (ids.length === 0) return [];
        return this.repository.find({
            where: { id: In(ids), spuId },
        });
    };

    findBySpu = async (spuId: string): Promise<ProductAttributeEntity[]> => {
        return this.repository.find({
            where: { spuId },
        });
    };
}

const productAttributeRepository = new ProductAttributeRepository();
export default productAttributeRepository;
