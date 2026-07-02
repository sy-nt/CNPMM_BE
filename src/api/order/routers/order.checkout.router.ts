import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { idempotency } from "@shared/lib/idempotency";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { orderCheckoutController } from "../controllers";
import { ORDER_PERMISSIONS } from "../order.constants";
import {
    checkoutPreviewRequestSchema,
    placeOrderRequestSchema,
} from "../order.schema";

const orderCheckoutRouter = Router();

orderCheckoutRouter.post(
    "/checkout/preview",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: checkoutPreviewRequestSchema }),
    rbac([ORDER_PERMISSIONS.ORDER_PREVIEW]),
    asyncWrapper(orderCheckoutController.previewCheckout),
);

orderCheckoutRouter.post(
    "/checkout",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: placeOrderRequestSchema }),
    rbac([ORDER_PERMISSIONS.ORDER_PLACE]),
    idempotency({ required: true }),
    asyncWrapper(orderCheckoutController.placeOrder),
);

export { orderCheckoutRouter };
