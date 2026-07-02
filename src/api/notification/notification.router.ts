import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { NOTIFICATION_PERMISSIONS } from "./notification.constants";
import notificationController from "./notification.controller";
import { markNotificationParamsSchema } from "./notification.schema";

const notificationRouter = Router();

notificationRouter.patch(
    "/:id/read",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: markNotificationParamsSchema }),
    rbac([NOTIFICATION_PERMISSIONS.NOTIFICATION_UPDATE]),
    asyncWrapper(notificationController.markAsRead),
);

notificationRouter.patch(
    "/:id/unread",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: markNotificationParamsSchema }),
    rbac([NOTIFICATION_PERMISSIONS.NOTIFICATION_UPDATE]),
    asyncWrapper(notificationController.markAsUnread),
);

export default notificationRouter;
