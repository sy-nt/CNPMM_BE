import { SHOP_DISCOUNT_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { DISCOUNT_PERMISSIONS } from "./discount.constants";
import discountController from "./discount.controller";
import {
    getDiscountsRequestQuerySchema,
    getShopDiscountsRequestQuerySchema,
} from "./discount.schema";

const discountsRouter = Router();

discountsRouter.get(
    "/shop",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getShopDiscountsRequestQuerySchema }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_READ]),
    asyncWrapper(discountController.getShopDiscounts),
);

discountsRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getDiscountsRequestQuerySchema }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_READ]),
    asyncWrapper(discountController.getDiscounts),
);

export default discountsRouter;
