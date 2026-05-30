import { Column, Entity, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";

@Entity({
    name: "delivery_methods",
})
@Unique(["code"])
export class DeliveryMethodEntity extends BaseEntityWithUUID {
    @Column({
        length: 64,
        type: "varchar",
    })
    code!: string;

    @Column({
        nullable: true,
        type: "text",
    })
    description?: string;

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

    @Column({
        default: "zone-table",
        length: 64,
        name: "provider_code",
        type: "varchar",
    })
    providerCode!: string;
}
