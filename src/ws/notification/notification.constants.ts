export const NOTIFICATION_REDIS_CHANNEL_PREFIX = "notification:user:";

export const NOTIFICATION_WS_PATH = "/ws/notifications";

export const NOTIFICATION_WS_PING_INTERVAL_MS = 30_000;

export const NOTIFICATION_WS_EVENT = {
    NOTIFICATION: "notification",
    PING: "ping",
    PONG: "pong",
} as const;

export const NOTIFICATION_ORDER_CREATED_BODY =
    "Your order has been placed and is awaiting confirmation.";
export const NOTIFICATION_ORDER_CREATED_TITLE = "Order placed";

export const NOTIFICATION_ORDER_STATUS_BODY_PREFIX =
    "Your order status has been updated to";
export const NOTIFICATION_ORDER_STATUS_TITLE = "Order status updated";

export enum NotificationError {
    NOTIFICATION_NOT_FOUND = "Notification not found",
}
