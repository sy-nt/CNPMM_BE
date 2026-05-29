import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    AdjustInventoryRequestDto,
    GetInventoryByWarehouseRequestDto,
    SetInventoryRequestDto,
} from "./inventory.dto";
import inventoryService from "./inventory.service";

export class InventoryController {
    @OkResponse()
    async adjustInventory(req: Request) {
        const { skuId, warehouseId } = extractRequest<{
            skuId: string;
            warehouseId: string;
        }>(req, "params");
        const dto = extractRequest<AdjustInventoryRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return inventoryService.adjustInventory({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
            skuId,
            warehouseId,
        });
    }

    @OkResponse()
    async getInventoryBySku(req: Request) {
        const { skuId } = extractRequest<{ skuId: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return inventoryService.getInventoryBySku({
            shopId: jwtPayload!.assignedShopId!,
            skuId,
        });
    }

    @OkResponse()
    async getInventoryByWarehouse(req: Request) {
        const { warehouseId } = extractRequest<{ warehouseId: string }>(
            req,
            "params",
        );
        const dto = extractRequest<GetInventoryByWarehouseRequestDto>(
            req,
            "query",
        );
        const jwtPayload = RequestContextService.getJwtPayload();
        return inventoryService.getInventoryByWarehouse({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
            warehouseId,
        });
    }

    @OkResponse()
    async setInventory(req: Request) {
        const { skuId, warehouseId } = extractRequest<{
            skuId: string;
            warehouseId: string;
        }>(req, "params");
        const dto = extractRequest<SetInventoryRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return inventoryService.setInventory({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
            skuId,
            warehouseId,
        });
    }
}

const inventoryController = new InventoryController();
export default inventoryController;
