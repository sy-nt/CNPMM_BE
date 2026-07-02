import { Column, Entity, Index, JoinColumn, OneToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { UserEntity } from "./user.entity";

export enum ShopStatus {
    ACTIVE = "active",
    PENDING = "pending",
    SUSPENDED = "suspended",
}

@Entity({
    name: "shops",
})
@Index(["status"])
@Unique(["ownerId"])
@Unique(["slug"])
export class ShopEntity extends BaseEntityWithUUID {
    @Column({
        nullable: true,
        type: "text",
    })
    description?: string;

    @Column({
        length: 255,
        name: "image_key",
        nullable: true,
        type: "varchar",
    })
    imageKey?: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    name!: string;

    @JoinColumn({ name: "owner_id" })
    @OneToOne(() => UserEntity, { nullable: false })
    owner!: UserEntity;

    @Column({
        length: 36,
        name: "owner_id",
        type: "char",
    })
    ownerId!: string;

    @Column({
        length: 255,
        type: "varchar",
        unique: true,
    })
    slug!: string;

    @Column({
        default: ShopStatus.PENDING,
        enum: ShopStatus,
        type: "enum",
    })
    status!: ShopStatus;
}
