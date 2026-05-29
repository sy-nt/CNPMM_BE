import { Column, Entity, Index, ManyToMany, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { RoleEntity } from "./role.entity";

@Entity({
    name: "permissions",
})
@Index(["name"])
@Unique(["name"])
export class PermissionEntity extends BaseEntityWithUUID {
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

    @ManyToMany(() => RoleEntity, (role) => role.permissions)
    roles!: RoleEntity[];
}
