import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { SHOP_PERMISSIONS, SHOP_STAFF_PERMISSIONS } from "./shop.constants";
import shopController from "./shop.controller";
import {
    assignWorkerRequestSchema,
    createShopRequestSchema,
    getShopRequestParamsSchema,
    updateShopRequestSchema,
    updateShopStatusRequestSchema,
} from "./shop.schema";

const shopRouter = Router();

shopRouter.post(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createShopRequestSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_REGISTER]),
    asyncWrapper(shopController.registerShop),
);

shopRouter.post(
    "/workers",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: assignWorkerRequestSchema }),
    rbac([SHOP_STAFF_PERMISSIONS.SHOP_STAFF_ASSIGN]),
    asyncWrapper(shopController.assignWorker),
);

shopRouter.put(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: updateShopRequestSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_UPDATE]),
    asyncWrapper(shopController.updateShop),
);

shopRouter.patch(
    "/status",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: updateShopStatusRequestSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_VERIFY]),
    asyncWrapper(shopController.updateShopStatus),
);

shopRouter.get(
    "/:idOrSlug",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ params: getShopRequestParamsSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_READ]),
    asyncWrapper(shopController.getShop),
);

shopRouter.get(
    "/details/:idOrSlug",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ params: getShopRequestParamsSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_READ]),
    asyncWrapper(shopController.getShopDetails),
);
export default shopRouter;
