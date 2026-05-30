import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { DeliveryMethodEntity } from "./deliveryMethod.entity";
import { DeliveryZoneEntity } from "./deliveryZone.entity";

@Entity({
    name: "delivery_zone_rates",
})
@Index(["deliveryMethodId"])
@Index(["deliveryZoneId"])
@Unique(["deliveryMethodId", "deliveryZoneId"])
export class DeliveryZoneRateEntity extends BaseEntityWithUUID {
    @Column({
        name: "base_fee",
        precision: 12,
        scale: 2,
        type: "decimal",
    })
    baseFee!: string;

    @JoinColumn({ name: "delivery_method_id" })
    @ManyToOne(() => DeliveryMethodEntity, { nullable: false })
    deliveryMethod!: DeliveryMethodEntity;

    @Column({
        length: 36,
        name: "delivery_method_id",
        type: "char",
    })
    deliveryMethodId!: string;

    @JoinColumn({ name: "delivery_zone_id" })
    @ManyToOne(() => DeliveryZoneEntity, { nullable: false })
    deliveryZone!: DeliveryZoneEntity;

    @Column({
        length: 36,
        name: "delivery_zone_id",
        type: "char",
    })
    deliveryZoneId!: string;
}
