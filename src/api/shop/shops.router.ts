import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { SHOP_PERMISSIONS } from "./shop.constants";
import shopController from "./shop.controller";
import { getShopsRequestSchema } from "./shop.schema";

const shopsRouter = Router();

shopsRouter.get(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ query: getShopsRequestSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_READ]),
    asyncWrapper(shopController.getShops),
);

export default shopsRouter;
