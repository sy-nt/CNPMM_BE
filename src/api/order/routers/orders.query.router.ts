import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { orderQueryController } from "../controllers";
import { ORDER_PERMISSIONS } from "../order.constants";
import { getOrdersRequestQuerySchema } from "../order.schema";

const ordersQueryRouter = Router();

ordersQueryRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getOrdersRequestQuerySchema }),
    rbac([ORDER_PERMISSIONS.ORDER_READ]),
    asyncWrapper(orderQueryController.getOrders),
);

export { ordersQueryRouter };
