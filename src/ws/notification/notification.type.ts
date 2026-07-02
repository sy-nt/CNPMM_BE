import { NotificationType } from "@domain/entities";

export interface NotificationPayload {
    body: string;
    createdAt: string;
    data: Record<string, unknown>;
    id: string;
    readAt: null | string;
    title: string;
    type: NotificationType;
}

export interface OrderNotificationData {
    orderId: string;
    previousStatus?: string;
    shopId: string;
    status: string;
}
