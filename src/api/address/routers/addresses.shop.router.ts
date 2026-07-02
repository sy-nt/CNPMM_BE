import { SHOP_ADDRESS_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { Router } from "express";

import { addressShopController } from "../controllers";

const addressesShopRouter = Router();

addressesShopRouter.get(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([SHOP_ADDRESS_PERMISSIONS.SHOP_ADDRESS_READ]),
    asyncWrapper(addressShopController.getAddresses),
);

export { addressesShopRouter };
