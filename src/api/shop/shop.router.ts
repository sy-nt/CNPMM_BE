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
    unassignWorkerRequestSchema,
    updateShopRequestSchema,
} from "./shop.schema";

const shopRouter = Router();

shopRouter.post(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createShopRequestSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_REGISTER]),
    asyncWrapper(shopController.registerShop),
);

shopRouter.get(
    "/workers",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([SHOP_PERMISSIONS.SHOP_READ]),
    asyncWrapper(shopController.getWorkers),
);

shopRouter.post(
    "/workers",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: assignWorkerRequestSchema }),
    rbac([SHOP_STAFF_PERMISSIONS.SHOP_STAFF_ASSIGN]),
    asyncWrapper(shopController.assignWorker),
);

shopRouter.delete(
    "/workers",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: unassignWorkerRequestSchema }),
    rbac([SHOP_STAFF_PERMISSIONS.SHOP_STAFF_UNASSIGN]),
    asyncWrapper(shopController.unassignWorker),
);

shopRouter.put(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: updateShopRequestSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_UPDATE]),
    asyncWrapper(shopController.updateShop),
);

shopRouter.get(
    "/details/me",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([SHOP_PERMISSIONS.SHOP_READ]),
    asyncWrapper(shopController.getMyShopDetails),
);

shopRouter.get(
    "/details/:idOrSlug",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ params: getShopRequestParamsSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_READ]),
    asyncWrapper(shopController.getShopDetails),
);

shopRouter.get(
    "/:idOrSlug",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ params: getShopRequestParamsSchema }),
    rbac([SHOP_PERMISSIONS.SHOP_READ]),
    asyncWrapper(shopController.getShop),
);

export default shopRouter;
