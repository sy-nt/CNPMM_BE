import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { RoleEntity } from "./role.entity";
import { ShopEntity } from "./shop.entity";

@Entity({
    name: "users",
})
@Index(["email"])
@Index(["roleId"])
export class UserEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "assigned_shop_id" })
    @ManyToOne(() => ShopEntity, { nullable: true })
    assignedShop?: ShopEntity;

    @Column({
        default: null,
        length: 36,
        name: "assigned_shop_id",
        nullable: true,
        type: "char",
    })
    assignedShopId?: null | string;

    @Column({
        length: 255,
        type: "varchar",
        unique: true,
    })
    email!: string;

    @Column({
        length: 255,
        name: "first_name",
        nullable: true,
        type: "varchar",
    })
    firstName!: string;

    @Column({
        length: 255,
        name: "image_key",
        nullable: true,
        type: "varchar",
    })
    imageKey?: string;

    @Column({
        default: false,
        name: "is_active",
        type: "boolean",
    })
    isActive?: boolean;

    @Column({
        default: false,
        name: "is_blocked",
        type: "boolean",
    })
    isBlocked?: boolean;

    @Column({
        length: 255,
        name: "last_name",
        nullable: true,
        type: "varchar",
    })
    lastName?: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    password!: string;

    @JoinColumn({ name: "role_id" })
    @ManyToOne(() => RoleEntity, { nullable: false })
    role!: RoleEntity;

    @Column({
        length: 36,
        name: "role_id",
        type: "char",
    })
    roleId!: string;
}
