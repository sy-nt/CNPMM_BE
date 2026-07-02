import { SHOP_CATALOG_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import {
    createCategoryRequestSchema,
    deleteCategoryRequestParamsSchema,
    updateCategoryRequestBodySchema,
    updateCategoryRequestParamsSchema,
} from "../category.schema";
import categoryShopController from "../controllers/category.shop.controller";

const categoryShopRouter = Router();

categoryShopRouter.post(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createCategoryRequestSchema }),
    rbac([SHOP_CATALOG_PERMISSIONS.SHOP_CATALOG_CREATE]),
    asyncWrapper(categoryShopController.createCategory),
);

categoryShopRouter.delete(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: deleteCategoryRequestParamsSchema }),
    rbac([SHOP_CATALOG_PERMISSIONS.SHOP_CATALOG_DELETE]),
    asyncWrapper(categoryShopController.deleteCategory),
);

categoryShopRouter.put(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateCategoryRequestBodySchema,
        params: updateCategoryRequestParamsSchema,
    }),
    rbac([SHOP_CATALOG_PERMISSIONS.SHOP_CATALOG_UPDATE]),
    asyncWrapper(categoryShopController.updateCategory),
);

export { categoryShopRouter };
