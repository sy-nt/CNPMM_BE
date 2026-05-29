import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    Unique,
    VersionColumn,
} from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { CategoryEntity } from "./category.entity";
import { ShopEntity } from "./shop.entity";

@Entity({
    name: "spus",
})
@Index(["categoryId"])
@Index(["shopId"])
@Unique(["shopId", "slug"])
export class SpuEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "category_id" })
    @ManyToOne(() => CategoryEntity, { nullable: false })
    category!: CategoryEntity;

    @Column({
        length: 36,
        name: "category_id",
        type: "char",
    })
    categoryId!: string;

    @Column({
        nullable: true,
        type: "text",
    })
    description?: string;

    @Column({
        default: true,
        name: "is_active",
        type: "boolean",
    })
    isActive!: boolean;

    @Column({
        length: 255,
        name: "main_image_key",
        nullable: true,
        type: "varchar",
    })
    mainImageKey?: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    name!: string;

    @Column({
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    price!: string;

    @JoinColumn({ name: "shop_id" })
    @ManyToOne(() => ShopEntity, { nullable: false })
    shop!: ShopEntity;

    @Column({
        length: 36,
        name: "shop_id",
        type: "char",
    })
    shopId!: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    slug!: string;

    @VersionColumn({
        default: 1,
        type: "int",
    })
    version!: number;
}
