import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { SHOP_PERMISSIONS } from "../shop.constants";
import shopController from "../shop.controller";
import { updateShopStatusRequestSchema } from "../shop.schema";

const shopAdminRouter = Router();

shopAdminRouter.patch(
    "/status",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: updateShopStatusRequestSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_VERIFY]),
    asyncWrapper(shopController.updateShopStatus),
);

export { shopAdminRouter };
