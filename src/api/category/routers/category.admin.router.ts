import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { CATEGORY_PERMISSIONS } from "../category.constants";
import {
    createCategoryRequestSchema,
    deleteCategoryRequestParamsSchema,
    updateCategoryRequestBodySchema,
    updateCategoryRequestParamsSchema,
} from "../category.schema";
import categoryAdminController from "../controllers/category.admin.controller";

const categoryAdminRouter = Router();

categoryAdminRouter.post(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createCategoryRequestSchema }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_CREATE]),
    asyncWrapper(categoryAdminController.createCategory),
);

categoryAdminRouter.delete(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: deleteCategoryRequestParamsSchema }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_DELETE]),
    asyncWrapper(categoryAdminController.deleteCategory),
);

categoryAdminRouter.put(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateCategoryRequestBodySchema,
        params: updateCategoryRequestParamsSchema,
    }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_UPDATE]),
    asyncWrapper(categoryAdminController.updateCategory),
);

export { categoryAdminRouter };
