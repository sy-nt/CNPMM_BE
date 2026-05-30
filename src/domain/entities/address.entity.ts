import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { ShopEntity } from "./shop.entity";
import { UserEntity } from "./user.entity";

@Entity({
    name: "addresses",
})
@Index(["userId"])
export class AddressEntity extends BaseEntityWithUUID {
    @Column({
        length: 255,
        name: "address_line",
        type: "varchar",
    })
    addressLine!: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    city!: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    country!: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    district!: string;

    @Column({
        default: false,
        name: "is_primary",
        type: "boolean",
    })
    isPrimary!: boolean;

    @Column({
        nullable: true,
        precision: 10,
        scale: 7,
        type: "decimal",
    })
    latitude?: string;

    @Column({
        nullable: true,
        precision: 10,
        scale: 7,
        type: "decimal",
    })
    longitude?: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    name!: string;

    @JoinColumn({ name: "shop_id" })
    @ManyToOne(() => ShopEntity, { nullable: true })
    shop?: ShopEntity;

    @Column({
        length: 36,
        name: "shop_id",
        nullable: true,
        type: "char",
    })
    shopId?: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    state!: string;

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
