import type {
    ProductAttributeEntity,
    ProductAttributeValueEntity,
    SkuEntity,
    SpuEntity,
} from "@domain/entities";

export type SpuWithRelations = {
    attributes?: Array<
        { values?: ProductAttributeValueEntity[] } & ProductAttributeEntity
    >;
    skus?: Array<
        {
            selections?: Array<{
                attributeId: string;
                attributeValueId: string;
            }>;
        } & SkuEntity
    >;
} & SpuEntity;
