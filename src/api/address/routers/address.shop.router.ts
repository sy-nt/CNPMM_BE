import { SHOP_ADDRESS_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import {
    addressIdParamsSchema,
    createAddressRequestSchema,
    updateAddressRequestBodySchema,
} from "../address.schema";
import { addressShopController } from "../controllers";

const addressShopRouter = Router();

addressShopRouter.post(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createAddressRequestSchema }),
    rbac([SHOP_ADDRESS_PERMISSIONS.SHOP_ADDRESS_CREATE]),
    asyncWrapper(addressShopController.createAddress),
);

addressShopRouter.delete(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: addressIdParamsSchema }),
    rbac([SHOP_ADDRESS_PERMISSIONS.SHOP_ADDRESS_DELETE]),
    asyncWrapper(addressShopController.deleteAddress),
);

addressShopRouter.patch(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateAddressRequestBodySchema,
        params: addressIdParamsSchema,
    }),
    rbac([SHOP_ADDRESS_PERMISSIONS.SHOP_ADDRESS_UPDATE]),
    asyncWrapper(addressShopController.updateAddress),
);

export { addressShopRouter };
