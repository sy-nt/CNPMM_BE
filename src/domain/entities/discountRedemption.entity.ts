import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { DiscountEntity } from "./discount.entity";
import { OrderEntity } from "./order.entity";
import { UserEntity } from "./user.entity";

@Entity({
    name: "discount_redemptions",
})
@Index(["discountId"])
@Index(["discountId", "userId"])
@Index(["orderId"])
export class DiscountRedemptionEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "discount_id" })
    @ManyToOne(() => DiscountEntity, { nullable: false })
    discount!: DiscountEntity;

    @Column({
        length: 36,
        name: "discount_id",
        type: "char",
    })
    discountId!: string;

    @JoinColumn({ name: "order_id" })
    @ManyToOne(() => OrderEntity, { nullable: true })
    order?: OrderEntity;

    @Column({
        length: 36,
        name: "order_id",
        nullable: true,
        type: "char",
    })
    orderId?: string;

    @Column({
        name: "redeemed_amount",
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    redeemedAmount!: string;

    @JoinColumn({ name: "user_id" })
    @ManyToOne(() => UserEntity, { nullable: false })
    user!: UserEntity;

    @Column({
        length: 36,
        name: "user_id",
        type: "char",
    })
    userId!: string;
}
