import AppDataSource from "@domain/db/mysql";
import { NotificationEntity } from "@domain/entities";
import { DeepPartial } from "typeorm";
import { IsNull } from "typeorm";

import { BaseRepository } from "./base";

export class NotificationRepository extends BaseRepository<NotificationEntity> {
    constructor() {
        super(NotificationEntity);
    }

    countUnreadByUserId = async (userId: string): Promise<number> => {
        const manager = await this._entityManager();
        return manager.count(NotificationEntity, {
            where: { readAt: IsNull(), userId },
        });
    };

    createOutsideRequest = async (
        data: DeepPartial<NotificationEntity>,
    ): Promise<NotificationEntity> => {
        const repository = AppDataSource.getRepository(NotificationEntity);
        const entity = repository.create(data);
        return repository.save(entity);
    };

    markAllReadByUserId = async (userId: string): Promise<number> => {
        const manager = await this._entityManager();
        const result = await manager.update(
            NotificationEntity,
            { readAt: IsNull(), userId },
            { readAt: new Date() },
        );
        return result.affected ?? 0;
    };

    markRead = async (
        id: string,
        userId: string,
    ): Promise<NotificationEntity | null> => {
        const manager = await this._entityManager();
        const existing = await manager.findOne(NotificationEntity, {
            where: { id, userId },
        });
        if (!existing) return null;
        if (existing.readAt) return existing;
        await manager.update(
            NotificationEntity,
            { id, userId },
            { readAt: new Date() },
        );
        return manager.findOne(NotificationEntity, { where: { id, userId } });
    };

    markUnread = async (
        id: string,
        userId: string,
    ): Promise<NotificationEntity | null> => {
        const manager = await this._entityManager();
        const existing = await manager.findOne(NotificationEntity, {
            where: { id, userId },
        });
        if (!existing) return null;
        if (!existing.readAt) return existing;
        await manager.update(
            NotificationEntity,
            { id, userId },
            { readAt: null },
        );
        return manager.findOne(NotificationEntity, { where: { id, userId } });
    };
}

const notificationRepository = new NotificationRepository();
export default notificationRepository;
