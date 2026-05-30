import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { AddressEntity } from "./address.entity";
import { BaseEntityWithUUID } from "./base";
import { DeliveryMethodEntity } from "./deliveryMethod.entity";

export enum DeliveryStatus {
    CANCELLED = "cancelled",
    DELIVERED = "delivered",
    IN_TRANSIT = "in_transit",
    PENDING = "pending",
}

@Entity({
    name: "deliveries",
})
@Index(["orderId"])
@Index(["status"])
export class DeliveryEntity extends BaseEntityWithUUID {
    @JoinColumn({ name: "delivery_method_id" })
    @ManyToOne(() => DeliveryMethodEntity, { nullable: false })
    deliveryMethod!: DeliveryMethodEntity;

    @Column({
        length: 36,
        name: "delivery_method_id",
        type: "char",
    })
    deliveryMethodId!: string;

    @JoinColumn({ name: "destination_address_id" })
    @ManyToOne(() => AddressEntity, { nullable: false })
    destinationAddress!: AddressEntity;

    @Column({
        length: 36,
        name: "destination_address_id",
        type: "char",
    })
    destinationAddressId!: string;

    @Column({
        name: "eta_max_days",
        type: "int",
    })
    etaMaxDays!: number;

    @Column({
        name: "eta_min_days",
        type: "int",
    })
    etaMinDays!: number;

    @Column({
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    fee!: string;

    @Column({
        nullable: true,
        type: "text",
    })
    notes?: string;

    @Column({
        length: 36,
        name: "order_id",
        nullable: true,
        type: "char",
    })
    orderId?: string;

    @JoinColumn({ name: "origin_address_id" })
    @ManyToOne(() => AddressEntity, { nullable: false })
    originAddress!: AddressEntity;

    @Column({
        length: 36,
        name: "origin_address_id",
        type: "char",
    })
    originAddressId!: string;

    @Column({
        length: 64,
        name: "provider_code",
        type: "varchar",
    })
    providerCode!: string;

    @Column({
        default: DeliveryStatus.PENDING,
        enum: DeliveryStatus,
        type: "enum",
    })
    status!: DeliveryStatus;

    @Column({
        length: 128,
        name: "tracking_code",
        nullable: true,
        type: "varchar",
    })
    trackingCode?: string;

    @Column({
        length: 64,
        name: "zone_code",
        nullable: true,
        type: "varchar",
    })
    zoneCode?: string;
}
