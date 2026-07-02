import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { ADDRESS_PERMISSIONS } from "../address.constants";
import {
    addressIdParamsSchema,
    createAddressRequestSchema,
    updateAddressRequestBodySchema,
} from "../address.schema";
import { addressPublicController } from "../controllers";

const addressPublicRouter = Router();

addressPublicRouter.post(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ body: createAddressRequestSchema }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_CREATE]),
    asyncWrapper(addressPublicController.createAddress),
);

addressPublicRouter.delete(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ params: addressIdParamsSchema }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_DELETE]),
    asyncWrapper(addressPublicController.deleteAddress),
);

addressPublicRouter.patch(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({
        body: updateAddressRequestBodySchema,
        params: addressIdParamsSchema,
    }),
    rbac([ADDRESS_PERMISSIONS.ADDRESS_UPDATE]),
    asyncWrapper(addressPublicController.updateAddress),
);

export { addressPublicRouter };
