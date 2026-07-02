import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { WAREHOUSE_PERMISSIONS } from "./warehouse.constants";
import warehouseController from "./warehouse.controller";
import {
    createWarehouseRequestSchema,
    deleteWarehouseRequestParamsSchema,
    getWarehouseRequestParamsSchema,
    updateWarehouseRequestBodySchema,
    updateWarehouseRequestParamsSchema,
} from "./warehouse.schema";

const warehouseRouter = Router();

warehouseRouter.post(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createWarehouseRequestSchema }),
    rbac([WAREHOUSE_PERMISSIONS.WAREHOUSE_CREATE]),
    asyncWrapper(warehouseController.createWarehouse),
);

warehouseRouter.put(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateWarehouseRequestBodySchema,
        params: updateWarehouseRequestParamsSchema,
    }),
    rbac([WAREHOUSE_PERMISSIONS.WAREHOUSE_UPDATE]),
    asyncWrapper(warehouseController.updateWarehouse),
);

warehouseRouter.delete(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: deleteWarehouseRequestParamsSchema }),
    rbac([WAREHOUSE_PERMISSIONS.WAREHOUSE_DELETE]),
    asyncWrapper(warehouseController.deleteWarehouse),
);

warehouseRouter.get(
    "/:id",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: getWarehouseRequestParamsSchema }),
    rbac([WAREHOUSE_PERMISSIONS.WAREHOUSE_READ]),
    asyncWrapper(warehouseController.getWarehouse),
);

export default warehouseRouter;
