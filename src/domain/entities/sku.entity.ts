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
import { SpuEntity } from "./spu.entity";

@Entity({
    name: "skus",
})
@Index(["spuId"])
@Unique(["skuCode"])
export class SkuEntity extends BaseEntityWithUUID {
    @Column({
        length: 255,
        name: "image_key",
        nullable: true,
        type: "varchar",
    })
    imageKey?: string;

    @Column({
        default: true,
        name: "is_active",
        type: "boolean",
    })
    isActive!: boolean;

    @Column({
        length: 255,
        nullable: true,
        type: "varchar",
    })
    name?: string;

    @Column({
        nullable: true,
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    price?: string;

    @Column({
        length: 64,
        name: "sku_code",
        type: "varchar",
    })
    skuCode!: string;

    @JoinColumn({ name: "spu_id" })
    @ManyToOne(() => SpuEntity, { nullable: false })
    spu!: SpuEntity;

    @Column({
        length: 36,
        name: "spu_id",
        type: "char",
    })
    spuId!: string;

    @VersionColumn({
        default: 1,
        type: "int",
    })
    version!: number;
}
