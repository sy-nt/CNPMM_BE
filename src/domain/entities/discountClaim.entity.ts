import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { DiscountEntity } from "./discount.entity";
import { UserEntity } from "./user.entity";

@Entity({
    name: "discount_claims",
})
@Index(["discountId"])
@Index(["userId", "discountId"])
export class DiscountClaimEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "discount_id" })
    @ManyToOne(() => DiscountEntity, { nullable: false })
    discount!: DiscountEntity;

    @Column({
        length: 36,
        name: "discount_id",
        type: "char",
    })
    discountId!: string;

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
