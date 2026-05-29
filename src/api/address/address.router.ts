import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { ADDRESS_PERMISSIONS } from "./address.constants";
import addressController from "./address.controller";
import {
    createAddressRequestSchema,
    deleteAddressRequestSchema,
    updateAddressRequestSchema,
} from "./address.schema";

const addressRouter = Router();

addressRouter.post(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: createAddressRequestSchema,
    }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_CREATE]),
    asyncWrapper(addressController.createAddress),
);

addressRouter.delete(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: deleteAddressRequestSchema,
    }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_DELETE]),
    asyncWrapper(addressController.deleteAddress),
);

addressRouter.put(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateAddressRequestSchema,
    }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_UPDATE]),
    asyncWrapper(addressController.updateAddress),
);

export default addressRouter;
