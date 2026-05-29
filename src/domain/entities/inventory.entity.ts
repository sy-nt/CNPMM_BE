import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
    VersionColumn,
} from "typeorm";

import { SkuEntity } from "./sku.entity";
import { WarehouseEntity } from "./warehouse.entity";

@Entity({
    name: "inventory",
})
@Index(["warehouseId"])
export class InventoryEntity {
    @CreateDateColumn({
        name: "created_at",
        type: "timestamp",
    })
    createdAt!: Date;

    @Column({
        default: 0,
        type: "int",
    })
    quantity!: number;

    @Column({
        default: 0,
        name: "reserved_quantity",
        type: "int",
    })
    reservedQuantity!: number;

    @JoinColumn({ name: "sku_id" })
    @ManyToOne(() => SkuEntity, { nullable: false })
    sku!: SkuEntity;

    @PrimaryColumn({
        length: 36,
        name: "sku_id",
        type: "char",
    })
    skuId!: string;

    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamp",
    })
    updatedAt!: Date;

    @VersionColumn({
        default: 1,
        type: "int",
    })
    version!: number;

    @JoinColumn({ name: "warehouse_id" })
    @ManyToOne(() => WarehouseEntity, { nullable: false })
    warehouse!: WarehouseEntity;

    @PrimaryColumn({
        length: 36,
        name: "warehouse_id",
        type: "char",
    })
    warehouseId!: string;
}
