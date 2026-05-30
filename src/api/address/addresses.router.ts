import { SHOP_ADDRESS_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { Router } from "express";

import { ADDRESS_PERMISSIONS } from "./address.constants";
import addressController from "./address.controller";

const addressesRouter = Router();

addressesRouter.get(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_READ]),
    asyncWrapper(addressController.getPersonalAddresses),
);

addressesRouter.get(
    "/shop",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([SHOP_ADDRESS_PERMISSIONS.SHOP_ADDRESS_READ]),
    asyncWrapper(addressController.getShopAddresses),
);

export default addressesRouter;
