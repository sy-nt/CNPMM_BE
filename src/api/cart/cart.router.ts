import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { idempotency } from "@shared/lib/idempotency";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { CART_PERMISSIONS } from "./cart.constants";
import cartController from "./cart.controller";
import {
    addItemRequestSchema,
    itemPathParamsSchema,
    updateItemRequestSchema,
} from "./cart.schema";

const cartRouter = Router();

cartRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([CART_PERMISSIONS.CART_READ]),
    asyncWrapper(cartController.getCart),
);

cartRouter.delete(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([CART_PERMISSIONS.CART_DELETE]),
    asyncWrapper(cartController.clearCart),
);

cartRouter.post(
    "/items",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: addItemRequestSchema }),
    rbac([CART_PERMISSIONS.CART_UPDATE]),
    idempotency(),
    asyncWrapper(cartController.addItem),
);

cartRouter.patch(
    "/items/:skuId",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateItemRequestSchema,
        params: itemPathParamsSchema,
    }),
    rbac([CART_PERMISSIONS.CART_UPDATE]),
    asyncWrapper(cartController.updateItem),
);

cartRouter.delete(
    "/items/:skuId",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: itemPathParamsSchema }),
    rbac([CART_PERMISSIONS.CART_UPDATE]),
    asyncWrapper(cartController.removeItem),
);

export default cartRouter;
