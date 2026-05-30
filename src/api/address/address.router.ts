import { SHOP_ADDRESS_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { ADDRESS_PERMISSIONS } from "./address.constants";
import addressController from "./address.controller";
import {
    addressIdParamsSchema,
    createAddressRequestSchema,
    updateAddressRequestBodySchema,
} from "./address.schema";

const addressRouter = Router();

addressRouter.post(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createAddressRequestSchema }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_CREATE]),
    asyncWrapper(addressController.createPersonalAddress),
);

addressRouter.post(
    "/shop",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createAddressRequestSchema }),
    rbac([SHOP_ADDRESS_PERMISSIONS.SHOP_ADDRESS_CREATE]),
    asyncWrapper(addressController.createShopAddress),
);

addressRouter.patch(
    "/shop/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateAddressRequestBodySchema,
        params: addressIdParamsSchema,
    }),
    rbac([SHOP_ADDRESS_PERMISSIONS.SHOP_ADDRESS_UPDATE]),
    asyncWrapper(addressController.updateShopAddress),
);

addressRouter.delete(
    "/shop/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: addressIdParamsSchema }),
    rbac([SHOP_ADDRESS_PERMISSIONS.SHOP_ADDRESS_DELETE]),
    asyncWrapper(addressController.deleteShopAddress),
);

addressRouter.patch(
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateAddressRequestBodySchema,
        params: addressIdParamsSchema,
    }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_UPDATE]),
    asyncWrapper(addressController.updatePersonalAddress),
);

addressRouter.delete(
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: addressIdParamsSchema }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_DELETE]),
    asyncWrapper(addressController.deletePersonalAddress),
);

export default addressRouter;
