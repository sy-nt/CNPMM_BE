import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { SHOP_PERMISSIONS } from "../shop.constants";
import shopController from "../shop.controller";
import { adminGetShopsRequestSchema } from "../shop.schema";

const shopsAdminRouter = Router();

shopsAdminRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: adminGetShopsRequestSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_VERIFY]),
    asyncWrapper(shopController.adminGetShops),
);

export { shopsAdminRouter };
