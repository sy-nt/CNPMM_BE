import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import discountAdminController from "../controllers/discount.admin.controller";
import { DISCOUNT_PERMISSIONS } from "../discount.constants";
import { getDiscountsRequestQuerySchema } from "../discount.schema";

const discountsAdminRouter = Router();

discountsAdminRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getDiscountsRequestQuerySchema }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_READ]),
    asyncWrapper(discountAdminController.getDiscounts),
);

export { discountsAdminRouter };
