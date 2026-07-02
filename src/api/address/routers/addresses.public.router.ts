import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { Router } from "express";

import { ADDRESS_PERMISSIONS } from "../address.constants";
import { addressPublicController } from "../controllers";

const addressesPublicRouter = Router();

addressesPublicRouter.get(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_READ]),
    asyncWrapper(addressPublicController.getAddresses),
);

export { addressesPublicRouter };
