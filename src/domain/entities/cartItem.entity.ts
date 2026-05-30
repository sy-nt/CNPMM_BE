import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { CartEntity } from "./cart.entity";
import { SkuEntity } from "./sku.entity";

@Entity({
    name: "cart_items",
})
@Index(["cartId"])
@Unique(["cartId", "skuId"])
export class CartItemEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "cart_id" })
    @ManyToOne(() => CartEntity, { nullable: false })
    cart!: CartEntity;

    @Column({
        length: 36,
        name: "cart_id",
        type: "char",
    })
    cartId!: string;

    @Column({
        default: 1,
        type: "int",
    })
    quantity!: number;

    @JoinColumn({ name: "sku_id" })
    @ManyToOne(() => SkuEntity, { nullable: false })
    sku!: SkuEntity;

    @Column({
        length: 36,
        name: "sku_id",
        type: "char",
    })
    skuId!: string;
}
