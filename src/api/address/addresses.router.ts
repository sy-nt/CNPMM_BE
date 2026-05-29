import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { ADDRESS_PERMISSIONS } from "./address.constants";
import addressController from "./address.controller";
import { getAddressesRequestSchema } from "./address.schema";

const addressesRouter = Router();

addressesRouter.get(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        query: getAddressesRequestSchema,
    }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_READ]),
    asyncWrapper(addressController.getAddresses),
);

export default addressesRouter;
