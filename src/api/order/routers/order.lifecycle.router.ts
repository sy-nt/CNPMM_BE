import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { idempotency } from "@shared/lib/idempotency";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { orderLifecycleController } from "../controllers";
import { ORDER_PERMISSIONS } from "../order.constants";
import {
    cancelOrderRequestBodySchema,
    orderIdParamsSchema,
    updateOrderStatusRequestBodySchema,
} from "../order.schema";

const orderLifecycleRouter = Router();

orderLifecycleRouter.patch(
    "/:id/status",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateOrderStatusRequestBodySchema,
        params: orderIdParamsSchema,
    }),
    rbac([ORDER_PERMISSIONS.ORDER_UPDATE_STATUS]),
    asyncWrapper(orderLifecycleController.updateOrderStatus),
);

orderLifecycleRouter.post(
    "/:id/cancel",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: cancelOrderRequestBodySchema,
        params: orderIdParamsSchema,
    }),
    rbac([ORDER_PERMISSIONS.ORDER_CANCEL]),
    idempotency(),
    asyncWrapper(orderLifecycleController.cancelOrder),
);

export { orderLifecycleRouter };
