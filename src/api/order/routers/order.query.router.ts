import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { orderQueryController } from "../controllers";
import { ORDER_PERMISSIONS } from "../order.constants";
import { orderIdParamsSchema } from "../order.schema";

const orderQueryRouter = Router();

orderQueryRouter.get(
    "/:id",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: orderIdParamsSchema }),
    rbac([ORDER_PERMISSIONS.ORDER_READ]),
    asyncWrapper(orderQueryController.getOrder),
);

export { orderQueryRouter };
