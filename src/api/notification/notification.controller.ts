import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import { GetNotificationsRequestDto } from "./notification.dto";
import notificationApiService from "./notification.service";

export class NotificationController {
    @OkResponse()
    async getNotifications(req: Request) {
        const query = extractRequest<GetNotificationsRequestDto>(req, "query");
        const jwt = RequestContextService.getJwtPayload()!;
        return notificationApiService.getNotifications({
            ...query,
            userId: jwt.userId,
        });
    }

    @OkResponse()
    async markAllAsRead(_req: Request) {
        const jwt = RequestContextService.getJwtPayload()!;
        return notificationApiService.markAllAsRead({ userId: jwt.userId });
    }

    @OkResponse()
    async markAsRead(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return notificationApiService.markAsRead({ id, userId: jwt.userId });
    }

    @OkResponse()
    async markAsUnread(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return notificationApiService.markAsUnread({ id, userId: jwt.userId });
    }
}

const notificationController = new NotificationController();
export default notificationController;
