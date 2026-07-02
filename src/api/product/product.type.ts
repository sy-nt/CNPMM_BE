import type {
    ProductAttributeEntity,
    ProductAttributeValueEntity,
    ShopEntity,
    SkuEntity,
    SpuEntity,
} from "@domain/entities";

export type SpuWithRelations = {
    attributes?: Array<
        { values?: ProductAttributeValueEntity[] } & ProductAttributeEntity
    >;
    shop?: ShopEntity;
    skus?: Array<
        {
            selections?: Array<{
                attributeId: string;
                attributeValueId: string;
            }>;
        } & SkuEntity
    >;
} & SpuEntity;
