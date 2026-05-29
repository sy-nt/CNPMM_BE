import { ProductAttributeValueEntity } from "@domain/entities";
import { In } from "typeorm";

import { BaseRepository } from "./base";

export class ProductAttributeValueRepository extends BaseRepository<ProductAttributeValueEntity> {
    constructor() {
        super(ProductAttributeValueEntity);
    }

    findByAttribute = async (
        attributeId: string,
    ): Promise<ProductAttributeValueEntity[]> => {
        return this.repository.find({
            where: { attributeId },
        });
    };

    findByAttributeIds = async (
        attributeIds: string[],
    ): Promise<ProductAttributeValueEntity[]> => {
        if (attributeIds.length === 0) return [];
        return this.repository.find({
            where: { attributeId: In(attributeIds) },
        });
    };

    findByIdsForAttribute = async (
        ids: string[],
        attributeId: string,
    ): Promise<ProductAttributeValueEntity[]> => {
        if (ids.length === 0) return [];
        return this.repository.find({
            where: { attributeId, id: In(ids) },
        });
    };
}

const productAttributeValueRepository = new ProductAttributeValueRepository();
export default productAttributeValueRepository;
