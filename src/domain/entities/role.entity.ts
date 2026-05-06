import { Column, Entity, Index, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";

@Entity({
    name: "roles",
})
@Index(["name"])
@Unique(["name"])
export class RoleEntity extends BaseEntityWithUUID {
    @Column({
        name: "description",
        type: "text",
    })
    description!: string;

    @Column({
        length: 255,
        name: "name",
        type: "varchar",
        unique: true,
    })
    name!: string;
}
