import {
    NotificationEntity,
    NotificationType,
    OrderStatus,
} from "@domain/entities";
import { NotFoundError } from "@shared/lib/http/httpError";
import { KeySetPaginationDto, KeySetPaginationResponse } from "@shared/types";
import { IsNull } from "typeorm";

import { NotificationBaseService } from "./notification.base.service";
import {
    NOTIFICATION_ORDER_CREATED_BODY,
    NOTIFICATION_ORDER_CREATED_TITLE,
    NOTIFICATION_ORDER_STATUS_BODY_PREFIX,
    NOTIFICATION_ORDER_STATUS_TITLE,
    NotificationError,
} from "./notification.constants";
import notificationPubSub from "./notification.pubsub";
import {
    NotificationPayload,
    OrderNotificationData,
} from "./notification.type";

export interface ListNotificationsDto extends KeySetPaginationDto {
    unreadOnly?: boolean;
    userId: string;
}

export class NotificationService extends NotificationBaseService {
    async listNotifications(
        dto: ListNotificationsDto,
    ): Promise<KeySetPaginationResponse<NotificationPayload>> {
        const where: Record<string, unknown> = { userId: dto.userId };
        if (dto.unreadOnly) {
            where.readAt = IsNull();
        }
        const result = await this.repositories.notification.paginateKeySet(
            { where },
            {
                lastId: dto.lastId,
                limit: dto.limit,
                sort: dto.sort,
            },
        );
        return {
            ...result,
            items: result.items.map((item) => this._toPayload(item)),
        };
    }

    async markAllAsRead(userId: string): Promise<number> {
        return this.repositories.notification.markAllReadByUserId(userId);
    }

    async markAsRead(id: string, userId: string): Promise<NotificationPayload> {
        const updated = await this.repositories.notification.markRead(
            id,
            userId,
        );
        if (!updated) {
            throw new NotFoundError(NotificationError.NOTIFICATION_NOT_FOUND);
        }
        return this._toPayload(updated);
    }

    async markAsUnread(
        id: string,
        userId: string,
    ): Promise<NotificationPayload> {
        const updated = await this.repositories.notification.markUnread(
            id,
            userId,
        );
        if (!updated) {
            throw new NotFoundError(NotificationError.NOTIFICATION_NOT_FOUND);
        }
        return this._toPayload(updated);
    }

    notifyOrderCreated(order: {
        id: string;
        shopId: string;
        status: OrderStatus;
        userId: string;
    }): void {
        const data: OrderNotificationData = {
            orderId: order.id,
            shopId: order.shopId,
            status: order.status,
        };
        void this._createAndPublish({
            body: NOTIFICATION_ORDER_CREATED_BODY,
            data,
            title: NOTIFICATION_ORDER_CREATED_TITLE,
            type: NotificationType.ORDER_CREATED,
            userId: order.userId,
        });
    }

    notifyOrderStatusChanged(order: {
        id: string;
        previousStatus: OrderStatus;
        shopId: string;
        status: OrderStatus;
        userId: string;
    }): void {
        if (order.previousStatus === order.status) return;
        const data: OrderNotificationData = {
            orderId: order.id,
            previousStatus: order.previousStatus,
            shopId: order.shopId,
            status: order.status,
        };
        void this._createAndPublish({
            body: `${NOTIFICATION_ORDER_STATUS_BODY_PREFIX} ${order.status}.`,
            data,
            title: NOTIFICATION_ORDER_STATUS_TITLE,
            type: NotificationType.ORDER_STATUS_CHANGED,
            userId: order.userId,
        });
    }

    private async _createAndPublish(input: {
        body: string;
        data: OrderNotificationData;
        title: string;
        type: NotificationType;
        userId: string;
    }): Promise<void> {
        const entity =
            await this.repositories.notification.createOutsideRequest({
                body: input.body,
                data: { ...input.data },
                title: input.title,
                type: input.type,
                userId: input.userId,
            });
        const payload = this._toPayload(entity);
        await notificationPubSub.publish(input.userId, payload);
    }

    private _toPayload(entity: NotificationEntity): NotificationPayload {
        return {
            body: entity.body,
            createdAt: entity.createdAt.toISOString(),
            data: entity.data,
            id: entity.id,
            readAt: entity.readAt ? entity.readAt.toISOString() : null,
            title: entity.title,
            type: entity.type,
        };
    }
}

const notificationService = new NotificationService();
export default notificationService;
