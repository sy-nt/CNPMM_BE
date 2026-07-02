import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import discountUserController from "../controllers/discount.user.controller";
import { DISCOUNT_PERMISSIONS } from "../discount.constants";
import {
    myClaimsRequestQuerySchema,
    platformDiscountListQuerySchema,
} from "../discount.schema";

const discountsUserRouter = Router();

discountsUserRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ query: platformDiscountListQuerySchema }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_READ]),
    asyncWrapper(discountUserController.listPlatformDiscounts),
);

discountsUserRouter.get(
    "/me/claims",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: myClaimsRequestQuerySchema }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_CLAIM]),
    asyncWrapper(discountUserController.getMyClaims),
);

export { discountsUserRouter };
