import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { UserEntity } from "./user.entity";

@Entity({
    name: "carts",
})
@Unique(["userId"])
export class CartEntity extends BaseEntityWithUUID {
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
