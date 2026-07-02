import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { DELIVERY_PERMISSIONS } from "./delivery.constants";
import deliveryController from "./delivery.controller";
import {
    createDeliveryMethodRequestSchema,
    createDeliveryRateRequestSchema,
    createDeliveryZoneRequestSchema,
    deliveryIdParamsSchema,
    quoteDeliveryRequestSchema,
    updateDeliveryMethodRequestBodySchema,
    updateDeliveryRateRequestBodySchema,
    updateDeliveryStatusRequestBodySchema,
    updateDeliveryZoneRequestBodySchema,
} from "./delivery.schema";

const deliveryRouter = Router();

deliveryRouter.post(
    "/quote",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: quoteDeliveryRequestSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_QUOTE]),
    asyncWrapper(deliveryController.quote),
);

deliveryRouter.get(
    "/:id",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: deliveryIdParamsSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_READ]),
    asyncWrapper(deliveryController.getDelivery),
);

deliveryRouter.patch(
    "/:id/status",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateDeliveryStatusRequestBodySchema,
        params: deliveryIdParamsSchema,
    }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_UPDATE_STATUS]),
    asyncWrapper(deliveryController.updateDeliveryStatus),
);

deliveryRouter.post(
    "/method",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createDeliveryMethodRequestSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_METHOD_CREATE]),
    asyncWrapper(deliveryController.createMethod),
);

deliveryRouter.get(
    "/method/:id",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({ params: deliveryIdParamsSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_METHOD_READ]),
    asyncWrapper(deliveryController.getMethod),
);

deliveryRouter.patch(
    "/method/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateDeliveryMethodRequestBodySchema,
        params: deliveryIdParamsSchema,
    }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_METHOD_UPDATE]),
    asyncWrapper(deliveryController.updateMethod),
);

deliveryRouter.delete(
    "/method/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: deliveryIdParamsSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_METHOD_DELETE]),
    asyncWrapper(deliveryController.deleteMethod),
);

deliveryRouter.post(
    "/zone",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createDeliveryZoneRequestSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_ZONE_CREATE]),
    asyncWrapper(deliveryController.createZone),
);

deliveryRouter.patch(
    "/zone/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateDeliveryZoneRequestBodySchema,
        params: deliveryIdParamsSchema,
    }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_ZONE_UPDATE]),
    asyncWrapper(deliveryController.updateZone),
);

deliveryRouter.delete(
    "/zone/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: deliveryIdParamsSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_ZONE_DELETE]),
    asyncWrapper(deliveryController.deleteZone),
);

deliveryRouter.post(
    "/rate",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createDeliveryRateRequestSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_RATE_CREATE]),
    asyncWrapper(deliveryController.createRate),
);

deliveryRouter.patch(
    "/rate/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateDeliveryRateRequestBodySchema,
        params: deliveryIdParamsSchema,
    }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_RATE_UPDATE]),
    asyncWrapper(deliveryController.updateRate),
);

deliveryRouter.delete(
    "/rate/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: deliveryIdParamsSchema }),
    rbac([DELIVERY_PERMISSIONS.DELIVERY_RATE_DELETE]),
    asyncWrapper(deliveryController.deleteRate),
);

export default deliveryRouter;
