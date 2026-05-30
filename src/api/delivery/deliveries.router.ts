import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { DELIVERY_PERMISSIONS } from "./delivery.constants";
import deliveryController from "./delivery.controller";
import {
    getDeliveriesRequestQuerySchema,
    getDeliveryRatesRequestQuerySchema,
} from "./delivery.schema";

const deliveriesRouter = Router();

deliveriesRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getDeliveriesRequestQuerySchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_READ]),
    asyncWrapper(deliveryController.getDeliveries),
);

deliveriesRouter.get(
    "/methods",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_METHOD_READ]),
    asyncWrapper(deliveryController.getMethods),
);

deliveriesRouter.get(
    "/zones",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_ZONE_READ]),
    asyncWrapper(deliveryController.getZones),
);

deliveriesRouter.get(
    "/rates",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getDeliveryRatesRequestQuerySchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_RATE_READ]),
    asyncWrapper(deliveryController.getRates),
);

export default deliveriesRouter;
