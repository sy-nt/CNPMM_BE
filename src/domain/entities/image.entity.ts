import { Column, Entity } from "typeorm";

import { BaseEntityWithUUID } from "./base";

@Entity({
    name: "images",
})
export class ImageEntity extends BaseEntityWithUUID {
    @Column({
        length: 255,
        name: "bucket",
        type: "varchar",
    })
    bucket!: string;

    @Column({
        name: "mime_type",
        type: "varchar",
    })
    mimeType!: string;

    @Column({
        name: "size",
        type: "int",
    })
    size!: number;

    @Column({
        length: 255,
        name: "storage_key",
        type: "varchar",
    })
    storageKey!: string;

    @Column({
        length: 255,
        name: "url",
        type: "varchar",
    })
    url!: string;
}
