import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { CATEGORY_PERMISSIONS } from "../category.constants";
import { getSystemCategoriesRequestQuerySchema } from "../category.schema";
import categoryPublicController from "../controllers/category.public.controller";

const categoriesPublicRouter = Router();

categoriesPublicRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ query: getSystemCategoriesRequestQuerySchema }),
    rbac([CATEGORY_PERMISSIONS.CATEGORY_READ]),
    asyncWrapper(categoryPublicController.getSystemCategories),
);

export { categoriesPublicRouter };
