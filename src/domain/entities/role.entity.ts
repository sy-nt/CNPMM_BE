import { Column, Entity, Index, JoinTable, ManyToMany, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { PermissionEntity } from "./permission.entity";

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
        default: false,
        name: "is_system_role",
        type: "boolean",
    })
    isSystemRole!: boolean;

    @Column({
        length: 255,
        name: "name",
        type: "varchar",
        unique: true,
    })
    name!: string;

    @JoinTable({
        inverseJoinColumn: {
            name: "permission_id",
            referencedColumnName: "id",
        },
        joinColumn: {
            name: "role_id",
            referencedColumnName: "id",
        },
        name: "role_permissions",
    })
    @ManyToMany(() => PermissionEntity, (permission) => permission.roles)
    permissions!: PermissionEntity[];
}
