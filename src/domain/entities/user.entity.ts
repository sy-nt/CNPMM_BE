import { Column, Entity, Index, JoinTable, ManyToMany, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { RoleEntity } from "./role.entity";

@Entity({
    name: "users",
})
@Index(["email"])
@Unique(["email"])
export class UserEntity extends BaseEntityWithUUID {
    @Column({
        length: 255,
        type: "varchar",
        unique: true,
    })
    email!: string;

    @Column({
        length: 255,
        name: "first_name",
        nullable: true,
        type: "varchar",
    })
    firstName!: string;

    @Column({
        length: 255,
        name: "image_url",
        nullable: true,
        type: "varchar",
    })
    imageUrl?: string;

    @Column({
        default: false,
        name: "is_active",
        type: "boolean",
    })
    isActive?: boolean;

    @Column({
        length: 255,
        name: "last_name",
        nullable: true,
        type: "varchar",
    })
    lastName?: string;

    @Column({
        length: 255,
        type: "varchar",
    })
    password!: string;

    @JoinTable({
        inverseJoinColumn: {
            name: "role_id",
            referencedColumnName: "id",
        },
        joinColumn: {
            name: "user_id",
            referencedColumnName: "id",
        },
        name: "user_roles",
    })
    @ManyToMany(() => RoleEntity)
    roles!: RoleEntity[];
}
