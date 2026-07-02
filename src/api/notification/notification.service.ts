import notificationService from "@ws/notification/notification.service";

import {
    GetNotificationsRequestDto,
    GetNotificationsResponseDto,
    MarkAllNotificationsReadRequestDto,
    MarkAllNotificationsReadResponseDto,
    MarkNotificationRequestDto,
    NotificationResponseDto,
} from "./notification.dto";

export class NotificationApiService {
    async getNotifications(
        dto: GetNotificationsRequestDto,
    ): Promise<GetNotificationsResponseDto> {
        return notificationService.listNotifications(dto);
    }

    async markAllAsRead(
        dto: MarkAllNotificationsReadRequestDto,
    ): Promise<MarkAllNotificationsReadResponseDto> {
        const updatedCount = await notificationService.markAllAsRead(
            dto.userId,
        );
        return { updatedCount };
    }

    async markAsRead(
        dto: MarkNotificationRequestDto,
    ): Promise<NotificationResponseDto> {
        return notificationService.markAsRead(dto.id, dto.userId);
    }

    async markAsUnread(
        dto: MarkNotificationRequestDto,
    ): Promise<NotificationResponseDto> {
        return notificationService.markAsUnread(dto.id, dto.userId);
    }
}

const notificationApiService = new NotificationApiService();
export default notificationApiService;
