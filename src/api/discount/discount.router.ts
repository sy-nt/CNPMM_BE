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
    createGlobalDiscountRequestSchema,
    createShopDiscountRequestSchema,
    discountIdParamsSchema,
    updateDiscountRequestBodySchema,
} from "./discount.schema";

const discountRouter = Router();

discountRouter.post(
    "/shop",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createShopDiscountRequestSchema }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_CREATE]),
    asyncWrapper(discountController.createShopDiscount),
);

discountRouter.get(
    "/shop/:id",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: discountIdParamsSchema }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_READ]),
    asyncWrapper(discountController.getShopDiscount),
);

discountRouter.patch(
    "/shop/:id",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateDiscountRequestBodySchema,
        params: discountIdParamsSchema,
    }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_UPDATE]),
    asyncWrapper(discountController.updateShopDiscount),
);

discountRouter.delete(
    "/shop/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: discountIdParamsSchema }),
    rbac([SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_DELETE]),
    asyncWrapper(discountController.deleteDiscount),
);

discountRouter.post(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createGlobalDiscountRequestSchema }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_CREATE]),
    asyncWrapper(discountController.createGlobalDiscount),
);

discountRouter.get(
    "/:id",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: discountIdParamsSchema }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_READ]),
    asyncWrapper(discountController.getDiscount),
);

discountRouter.patch(
    "/:id",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateDiscountRequestBodySchema,
        params: discountIdParamsSchema,
    }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_UPDATE]),
    asyncWrapper(discountController.updateDiscount),
);

discountRouter.delete(
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: discountIdParamsSchema }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_DELETE]),
    asyncWrapper(discountController.deleteDiscount),
);

export default discountRouter;
