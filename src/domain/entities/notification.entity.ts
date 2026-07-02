import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { BaseEntityWithUUID } from "./base";
import { UserEntity } from "./user.entity";

export enum NotificationType {
    ORDER_CREATED = "order_created",
    ORDER_STATUS_CHANGED = "order_status_changed",
}

@Entity({
    name: "notifications",
})
@Index(["userId"])
@Index(["userId", "readAt"])
export class NotificationEntity extends BaseEntityWithUUID {
    @Column({
        type: "text",
    })
    body!: string;

    @Column({
        type: "json",
    })
    data!: Record<string, unknown>;

    @Column({
        name: "read_at",
        nullable: true,
        type: "timestamp",
    })
    readAt?: Date | null;

    @Column({
        length: 255,
        type: "varchar",
    })
    title!: string;

    @Column({
        length: 64,
        type: "varchar",
    })
    type!: NotificationType;

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
