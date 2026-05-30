import { Column, Entity, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";

@Entity({
    name: "delivery_zones",
})
@Unique(["code"])
export class DeliveryZoneEntity extends BaseEntityWithUUID {
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
        default: 0,
        name: "display_order",
        type: "int",
    })
    displayOrder!: number;

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
}
