import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { CATEGORY_PERMISSIONS } from "./category.constants";
import categoryController from "./category.controller";
import { getSystemCategoriesRequestQuerySchema } from "./category.schema";

const categoriesRouter = Router();

categoriesRouter.get(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ query: getSystemCategoriesRequestQuerySchema }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_READ]),
    asyncWrapper(categoryController.getSystemCategories),
);

export default categoriesRouter;
