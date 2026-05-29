import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { INVENTORY_PERMISSIONS } from "./inventory.constants";
import inventoryController from "./inventory.controller";
import {
    adjustInventoryRequestBodySchema,
    inventoryKeyParamsSchema,
    inventorySkuParamsSchema,
    inventoryWarehouseParamsSchema,
    inventoryWarehouseQuerySchema,
    setInventoryRequestBodySchema,
} from "./inventory.schema";

const inventoryRouter = Router();

inventoryRouter.get(
    "/sku/:skuId",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: inventorySkuParamsSchema }),
    rbac([INVENTORY_PERMISSIONS.INVENTORY_READ]),
    asyncWrapper(inventoryController.getInventoryBySku),
);

inventoryRouter.get(
    "/warehouse/:warehouseId",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        params: inventoryWarehouseParamsSchema,
        query: inventoryWarehouseQuerySchema,
    }),
    rbac([INVENTORY_PERMISSIONS.INVENTORY_READ]),
    asyncWrapper(inventoryController.getInventoryByWarehouse),
);

inventoryRouter.patch(
    "/:skuId/:warehouseId",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: setInventoryRequestBodySchema,
        params: inventoryKeyParamsSchema,
    }),
    rbac([INVENTORY_PERMISSIONS.INVENTORY_UPDATE]),
    asyncWrapper(inventoryController.setInventory),
);

inventoryRouter.post(
    "/:skuId/:warehouseId/adjust",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: adjustInventoryRequestBodySchema,
        params: inventoryKeyParamsSchema,
    }),
    rbac([INVENTORY_PERMISSIONS.INVENTORY_ADJUST]),
    asyncWrapper(inventoryController.adjustInventory),
);

export default inventoryRouter;
