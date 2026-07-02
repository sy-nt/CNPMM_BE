import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { NOTIFICATION_PERMISSIONS } from "./notification.constants";
import notificationController from "./notification.controller";
import { getNotificationsRequestSchema } from "./notification.schema";

const notificationsRouter = Router();

notificationsRouter.patch(
    "/read-all",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([NOTIFICATION_PERMISSIONS.NOTIFICATION_UPDATE]),
    asyncWrapper(notificationController.markAllAsRead),
);

notificationsRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getNotificationsRequestSchema }),
    rbac([NOTIFICATION_PERMISSIONS.NOTIFICATION_READ]),
    asyncWrapper(notificationController.getNotifications),
);

export default notificationsRouter;
