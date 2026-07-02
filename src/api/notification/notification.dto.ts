import { NotificationType } from "@domain/entities";
import { KeySetPaginationDto, KeySetPaginationResponse } from "@shared/types";

export interface GetNotificationsRequestDto extends KeySetPaginationDto {
    unreadOnly?: boolean;
    userId: string;
}

export type GetNotificationsResponseDto =
    KeySetPaginationResponse<NotificationResponseDto>;

export interface MarkAllNotificationsReadRequestDto {
    userId: string;
}

export interface MarkAllNotificationsReadResponseDto {
    updatedCount: number;
}

export interface MarkNotificationRequestDto {
    id: string;
    userId: string;
}

export interface NotificationResponseDto {
    body: string;
    createdAt: string;
    data: Record<string, unknown>;
    id: string;
    readAt: null | string;
    title: string;
    type: NotificationType;
}
