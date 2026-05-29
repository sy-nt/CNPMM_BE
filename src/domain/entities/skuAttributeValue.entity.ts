import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";

import { ProductAttributeEntity } from "./productAttribute.entity";
import { ProductAttributeValueEntity } from "./productAttributeValue.entity";
import { SkuEntity } from "./sku.entity";

@Entity({
    name: "sku_attribute_values",
})
@Index(["attributeValueId"])
export class SkuAttributeValueEntity {
    @JoinColumn({ name: "attribute_id" })
    @ManyToOne(() => ProductAttributeEntity, { nullable: false })
    attribute!: ProductAttributeEntity;

    @PrimaryColumn({
        length: 36,
        name: "attribute_id",
        type: "char",
    })
    attributeId!: string;

    @JoinColumn({ name: "attribute_value_id" })
    @ManyToOne(() => ProductAttributeValueEntity, { nullable: false })
    attributeValue!: ProductAttributeValueEntity;

    @Column({
        length: 36,
        name: "attribute_value_id",
        type: "char",
    })
    attributeValueId!: string;

    @JoinColumn({ name: "sku_id" })
    @ManyToOne(() => SkuEntity, { nullable: false })
    sku!: SkuEntity;

    @PrimaryColumn({
        length: 36,
        name: "sku_id",
        type: "char",
    })
    skuId!: string;
}
