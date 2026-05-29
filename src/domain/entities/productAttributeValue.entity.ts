import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { ProductAttributeEntity } from "./productAttribute.entity";

@Entity({
    name: "product_attribute_values",
})
@Unique(["attributeId", "value"])
export class ProductAttributeValueEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "attribute_id" })
    @ManyToOne(() => ProductAttributeEntity, { nullable: false })
    attribute!: ProductAttributeEntity;

    @Column({
        length: 36,
        name: "attribute_id",
        type: "char",
    })
    attributeId!: string;

    @Column({
        default: 0,
        name: "display_order",
        type: "int",
    })
    displayOrder!: number;

    @Column({
        length: 64,
        type: "varchar",
    })
    value!: string;
}
