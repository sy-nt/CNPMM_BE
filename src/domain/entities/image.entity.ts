import { Column, Entity, Index, Unique } from "typeorm";

import { BaseEntityWithUUID } from "./base";

@Entity({
    name: "images",
})
@Index(["key"])
@Unique(["key"])
export class ImageEntity extends BaseEntityWithUUID {
    @Column({
        default: false,
        name: "is_used",
        type: "boolean",
    })
    isUsed!: boolean;

    @Column({
        length: 255,
        nullable: false,
        type: "varchar",
        unique: true,
    })
    key!: string;

    @Column({
        length: 255,
        name: "public_url",
        nullable: false,
        type: "varchar",
    })
    publicUrl!: string;

    @Column({
        name: "size",
        nullable: false,
        type: "bigint",
    })
    size!: number;

    @Column({
        length: 255,
        name: "used_for",
        nullable: false,
        type: "varchar",
    })
    usedFor!: string;
}
