import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { DiscountEntity } from "./discount.entity";
import { SpuEntity } from "./spu.entity";

@Entity({
    name: "discount_target_spus",
})
@Index(["discountId"])
@Unique(["discountId", "spuId"])
export class DiscountTargetSpuEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "discount_id" })
    @ManyToOne(() => DiscountEntity, { nullable: false })
    discount!: DiscountEntity;

    @Column({
        length: 36,
        name: "discount_id",
        type: "char",
    })
    discountId!: string;

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
