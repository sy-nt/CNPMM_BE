import { SHOP_DISCOUNT_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import discountShopController from "../controllers/discount.shop.controller";
import { getShopDiscountsRequestQuerySchema } from "../discount.schema";

const discountsShopRouter = Router();

discountsShopRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getShopDiscountsRequestQuerySchema }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_READ]),
    asyncWrapper(discountShopController.getDiscounts),
);

export { discountsShopRouter };
