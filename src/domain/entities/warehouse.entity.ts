import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    Unique,
} from "typeorm";

import { AddressEntity } from "./address.entity";
import { BaseEntityWithUUID } from "./base";
import { ShopEntity } from "./shop.entity";

@Entity({
    name: "warehouses",
})
@Index(["shopId"])
@Unique(["addressId"])
@Unique(["shopId", "code"])
export class WarehouseEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "address_id" })
    @OneToOne(() => AddressEntity, { nullable: false })
    address!: AddressEntity;

    @Column({
        length: 36,
        name: "address_id",
        type: "char",
    })
    addressId!: string;

    @Column({
        length: 64,
        type: "varchar",
    })
    code!: string;

    @Column({
        default: true,
        name: "is_active",
        type: "boolean",
    })
    isActive!: boolean;

    @Column({
        default: false,
        name: "is_default",
        type: "boolean",
    })
    isDefault!: boolean;

    @Column({
        length: 255,
        type: "varchar",
    })
    name!: string;

    @JoinColumn({ name: "shop_id" })
    @ManyToOne(() => ShopEntity, { nullable: false })
    shop!: ShopEntity;

    @Column({
        length: 36,
        name: "shop_id",
        type: "char",
    })
    shopId!: string;
}
