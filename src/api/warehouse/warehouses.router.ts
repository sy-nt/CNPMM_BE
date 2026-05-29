import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { WAREHOUSE_PERMISSIONS } from "./warehouse.constants";
import warehouseController from "./warehouse.controller";
import { getWarehousesRequestQuerySchema } from "./warehouse.schema";

const warehousesRouter = Router();

warehousesRouter.get(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getWarehousesRequestQuerySchema }),
    rbac([WAREHOUSE_PERMISSIONS.WAREHOUSE_READ]),
    asyncWrapper(warehouseController.getWarehouses),
);

export default warehousesRouter;
