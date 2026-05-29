import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { ShopEntity } from "./shop.entity";

@Entity({
    name: "categories",
})
@Index(["parentId"])
@Index(["shopId"])
@Unique(["slug"])
export class CategoryEntity extends BaseEntityWithUUID {
    @Column({
        nullable: true,
        type: "text",
    })
    description?: string;

    @Column({
        default: 0,
        name: "display_order",
        type: "int",
    })
    displayOrder!: number;

    @Column({
        length: 255,
        name: "icon_url",
        nullable: true,
        type: "varchar",
    })
    iconUrl?: string;

    @Column({
        default: true,
        name: "is_active",
        type: "boolean",
    })
    isActive!: boolean;

    @Column({
        length: 255,
        type: "varchar",
    })
    name!: string;

    @JoinColumn({ name: "parent_id" })
    @ManyToOne(() => CategoryEntity, { nullable: true })
    parent?: CategoryEntity;

    @Column({
        length: 36,
        name: "parent_id",
        nullable: true,
        type: "char",
    })
    parentId?: string;

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
        unique: true,
    })
    slug!: string;
}
