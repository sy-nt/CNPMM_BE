import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { ShopEntity } from "./shop.entity";

export enum DiscountScope {
    GLOBAL = "global",
    SHOP = "shop",
}

export enum DiscountType {
    DELIVERY = "delivery",
    ITEMS = "items",
}

export enum DiscountValueType {
    FIXED = "fixed",
    PERCENTAGE = "percentage",
}

export interface DiscountRule {
    params: unknown;
    type: string;
}

@Entity({
    name: "discounts",
})
@Index(["scope", "discountType", "isActive"])
@Index(["shopId"])
@Unique(["code"])
export class DiscountEntity extends BaseEntityWithUUID {
    @Column({
        length: 64,
        nullable: true,
        type: "varchar",
    })
    code?: string;

    @Column({
        nullable: true,
        type: "text",
    })
    description?: string;

    @Column({
        enum: DiscountType,
        name: "discount_type",
        type: "enum",
    })
    discountType!: DiscountType;

    @Column({
        default: true,
        name: "is_active",
        type: "boolean",
    })
    isActive!: boolean;

    @Column({
        name: "max_discount_amount",
        nullable: true,
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    maxDiscountAmount?: string;

    @Column({
        name: "max_uses",
        nullable: true,
        type: "int",
    })
    maxUses?: number;

    @Column({
        name: "max_uses_per_user",
        nullable: true,
        type: "int",
    })
    maxUsesPerUser?: number;

    @Column({
        length: 255,
        type: "varchar",
    })
    name!: string;

    @Column({
        default: () => "('[]')",
        type: "json",
    })
    rules!: DiscountRule[];

    @Column({
        enum: DiscountScope,
        type: "enum",
    })
    scope!: DiscountScope;

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
        default: 0,
        name: "used_count",
        type: "int",
    })
    usedCount!: number;

    @Column({
        name: "valid_from",
        nullable: true,
        type: "timestamp",
    })
    validFrom?: Date;

    @Column({
        name: "valid_until",
        nullable: true,
        type: "timestamp",
    })
    validUntil?: Date;

    @Column({
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    value!: string;

    @Column({
        enum: DiscountValueType,
        name: "value_type",
        type: "enum",
    })
    valueType!: DiscountValueType;
}
