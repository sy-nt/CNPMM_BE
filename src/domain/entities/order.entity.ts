import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { AddressEntity } from "./address.entity";
import { BaseEntityWithUUID } from "./base";
import { DeliveryEntity } from "./delivery.entity";
import { DiscountEntity } from "./discount.entity";
import { ShopEntity } from "./shop.entity";
import { UserEntity } from "./user.entity";

export enum OrderStatus {
    CANCELLED = "cancelled",
    COMPLETED = "completed",
    CONFIRMED = "confirmed",
    DELIVERED = "delivered",
    PENDING = "pending",
    PROCESSING = "processing",
    SHIPPED = "shipped",
}

export enum PaymentMethod {
    COD = "cod",
}

export enum PaymentStatus {
    PAID = "paid",
    UNPAID = "unpaid",
}

export interface DestinationAddressSnapshot {
    addressLine: string;
    city: string;
    country: string;
    district?: string;
    latitude?: string;
    longitude?: string;
    name: string;
    state: string;
}

@Entity({
    name: "orders",
})
@Index(["shopId"])
@Index(["status"])
@Index(["userId"])
export class OrderEntity extends BaseEntityWithUUID {
    @Column({
        length: 255,
        name: "cancellation_reason",
        nullable: true,
        type: "varchar",
    })
    cancellationReason?: string;

    @Column({
        name: "cancelled_at",
        nullable: true,
        type: "timestamp",
    })
    cancelledAt?: Date;

    @Column({
        length: 64,
        name: "cancelled_by_role_name",
        nullable: true,
        type: "varchar",
    })
    cancelledByRoleName?: string;

    @Column({
        length: 36,
        name: "cancelled_by_user_id",
        nullable: true,
        type: "char",
    })
    cancelledByUserId?: string;

    @Column({
        name: "completed_at",
        nullable: true,
        type: "timestamp",
    })
    completedAt?: Date;

    @Column({
        name: "confirmed_at",
        nullable: true,
        type: "timestamp",
    })
    confirmedAt?: Date;

    @Column({
        name: "delivered_at",
        nullable: true,
        type: "timestamp",
    })
    deliveredAt?: Date;

    @JoinColumn({ name: "delivery_id" })
    @ManyToOne(() => DeliveryEntity, { nullable: true })
    delivery?: DeliveryEntity;

    @JoinColumn({ name: "delivery_discount_id" })
    @ManyToOne(() => DiscountEntity, { nullable: true })
    deliveryDiscount?: DiscountEntity;

    @Column({
        default: "0.00",
        name: "delivery_discount_amount",
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    deliveryDiscountAmount!: string;

    @Column({
        length: 36,
        name: "delivery_discount_id",
        nullable: true,
        type: "char",
    })
    deliveryDiscountId?: string;

    @Column({
        name: "delivery_fee",
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    deliveryFee!: string;

    @Column({
        length: 36,
        name: "delivery_id",
        nullable: true,
        type: "char",
    })
    deliveryId?: string;

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
        name: "destination_address_snapshot",
        type: "json",
    })
    destinationAddressSnapshot!: DestinationAddressSnapshot;

    @JoinColumn({ name: "items_discount_id" })
    @ManyToOne(() => DiscountEntity, { nullable: true })
    itemsDiscount?: DiscountEntity;

    @Column({
        default: "0.00",
        name: "items_discount_amount",
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    itemsDiscountAmount!: string;

    @Column({
        length: 36,
        name: "items_discount_id",
        nullable: true,
        type: "char",
    })
    itemsDiscountId?: string;

    @Column({
        name: "items_subtotal",
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    itemsSubtotal!: string;

    @Column({
        default: PaymentMethod.COD,
        enum: PaymentMethod,
        name: "payment_method",
        type: "enum",
    })
    paymentMethod!: PaymentMethod;

    @Column({
        default: PaymentStatus.UNPAID,
        enum: PaymentStatus,
        name: "payment_status",
        type: "enum",
    })
    paymentStatus!: PaymentStatus;

    @Column({
        name: "processing_at",
        nullable: true,
        type: "timestamp",
    })
    processingAt?: Date;

    @Column({
        name: "shipped_at",
        nullable: true,
        type: "timestamp",
    })
    shippedAt?: Date;

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
        default: OrderStatus.PENDING,
        enum: OrderStatus,
        type: "enum",
    })
    status!: OrderStatus;

    @Column({
        name: "total_amount",
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    totalAmount!: string;

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
