import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { OrderEntity } from "./order.entity";
import { SkuEntity } from "./sku.entity";

export interface WarehouseAllocationEntry {
    quantity: number;
    warehouseId: string;
}

@Entity({
    name: "order_items",
})
@Index(["orderId"])
@Index(["skuId"])
@Unique(["orderId", "skuId"])
export class OrderItemEntity extends BaseEntityWithUUID {
    @Column({
        length: 255,
        name: "image_key_snapshot",
        nullable: true,
        type: "varchar",
    })
    imageKeySnapshot?: string;

    @Column({
        length: 255,
        name: "name_snapshot",
        type: "varchar",
    })
    nameSnapshot!: string;

    @JoinColumn({ name: "order_id" })
    @ManyToOne(() => OrderEntity, { nullable: false })
    order!: OrderEntity;

    @Column({
        length: 36,
        name: "order_id",
        type: "char",
    })
    orderId!: string;

    @Column({
        type: "int",
    })
    quantity!: number;

    @JoinColumn({ name: "sku_id" })
    @ManyToOne(() => SkuEntity, { nullable: false })
    sku!: SkuEntity;

    @Column({
        length: 36,
        name: "sku_id",
        type: "char",
    })
    skuId!: string;

    @Column({
        length: 36,
        name: "spu_id_snapshot",
        type: "char",
    })
    spuIdSnapshot!: string;

    @Column({
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    subtotal!: string;

    @Column({
        name: "unit_price_snapshot",
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    unitPriceSnapshot!: string;

    @Column({
        name: "warehouse_allocation",
        type: "json",
    })
    warehouseAllocation!: WarehouseAllocationEntry[];
}
