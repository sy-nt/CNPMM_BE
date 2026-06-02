import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { CATEGORY_PERMISSIONS } from "./category.constants";
import categoryController from "./category.controller";
import {
    createCategoryRequestSchema,
    deleteCategoryRequestParamsSchema,
    getCategoryTreeRequestParamsSchema,
    getCategoryTreeRequestQuerySchema,
    updateCategoryRequestBodySchema,
    updateCategoryRequestParamsSchema,
} from "./category.schema";

const categoryRouter = Router();

categoryRouter.post(
    "/",
    rateLimit({ limit: 20, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createCategoryRequestSchema }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_CREATE]),
    asyncWrapper(categoryController.createCategory),
);

categoryRouter.put(
    "/:id",
    rateLimit({ limit: 20, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateCategoryRequestBodySchema,
        params: updateCategoryRequestParamsSchema,
    }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_UPDATE]),
    asyncWrapper(categoryController.updateCategory),
);

categoryRouter.delete(
    "/:id",
    rateLimit({ limit: 20, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: deleteCategoryRequestParamsSchema }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_DELETE]),
    asyncWrapper(categoryController.deleteCategory),
);

categoryRouter.get(
    "/:id/tree",
    rateLimit({ limit: 20, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({
        params: getCategoryTreeRequestParamsSchema,
        query: getCategoryTreeRequestQuerySchema,
    }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_READ]),
    asyncWrapper(categoryController.getCategoryTree),
);

export default categoryRouter;
