import { SHOP_DISCOUNT_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import discountShopController from "../controllers/discount.shop.controller";
import {
    createShopDiscountRequestSchema,
    discountIdParamsSchema,
    updateDiscountRequestBodySchema,
} from "../discount.schema";

const discountShopRouter = Router();

discountShopRouter.post(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createShopDiscountRequestSchema }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_CREATE]),
    asyncWrapper(discountShopController.createShopDiscount),
);

discountShopRouter.get(
    "/:id",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: discountIdParamsSchema }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_READ]),
    asyncWrapper(discountShopController.getDiscount),
);

discountShopRouter.patch(
    "/:id",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateDiscountRequestBodySchema,
        params: discountIdParamsSchema,
    }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_UPDATE]),
    asyncWrapper(discountShopController.updateShopDiscount),
);

discountShopRouter.delete(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: discountIdParamsSchema }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_DELETE]),
    asyncWrapper(discountShopController.deleteDiscount),
);

export { discountShopRouter };
