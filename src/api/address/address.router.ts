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
    deleteAddressRequestParamsSchema,
    updateAddressRequestBodySchema,
    updateAddressRequestParamsSchema,
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
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        params: deleteAddressRequestParamsSchema,
    }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_DELETE]),
    asyncWrapper(addressController.deleteAddress),
);

addressRouter.put(
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateAddressRequestBodySchema,
        params: updateAddressRequestParamsSchema,
    }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_UPDATE]),
    asyncWrapper(addressController.updateAddress),
);

export default addressRouter;
