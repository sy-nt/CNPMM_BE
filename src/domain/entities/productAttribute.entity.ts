import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { SpuEntity } from "./spu.entity";

@Entity({
    name: "product_attributes",
})
@Unique(["spuId", "name"])
export class ProductAttributeEntity extends BaseEntityWithUUID {
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
    name!: string;

    @JoinColumn({ name: "spu_id" })
    @ManyToOne(() => SpuEntity, { nullable: false })
    spu!: SpuEntity;

    @Column({
        length: 36,
        name: "spu_id",
        type: "char",
    })
    spuId!: string;
}
