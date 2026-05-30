import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { idempotency } from "@shared/lib/idempotency";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { ORDER_PERMISSIONS } from "./order.constants";
import orderController from "./order.controller";
import {
    cancelOrderRequestBodySchema,
    checkoutPreviewRequestSchema,
    orderIdParamsSchema,
    placeOrderRequestSchema,
    updateOrderStatusRequestBodySchema,
} from "./order.schema";

const orderRouter = Router();

orderRouter.post(
    "/checkout/preview",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: checkoutPreviewRequestSchema }),
    rbac([ORDER_PERMISSIONS.ORDER_PREVIEW]),
    asyncWrapper(orderController.previewCheckout),
);

orderRouter.post(
    "/checkout",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: placeOrderRequestSchema }),
    rbac([ORDER_PERMISSIONS.ORDER_PLACE]),
    idempotency({ required: true }),
    asyncWrapper(orderController.placeOrder),
);

orderRouter.get(
    "/:id",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: orderIdParamsSchema }),
    rbac([ORDER_PERMISSIONS.ORDER_READ]),
    asyncWrapper(orderController.getOrder),
);

orderRouter.patch(
    "/:id/status",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateOrderStatusRequestBodySchema,
        params: orderIdParamsSchema,
    }),
    rbac([ORDER_PERMISSIONS.ORDER_UPDATE_STATUS]),
    asyncWrapper(orderController.updateOrderStatus),
);

orderRouter.post(
    "/:id/cancel",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: cancelOrderRequestBodySchema,
        params: orderIdParamsSchema,
    }),
    rbac([ORDER_PERMISSIONS.ORDER_CANCEL]),
    idempotency(),
    asyncWrapper(orderController.cancelOrder),
);

export default orderRouter;
