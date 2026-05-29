import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreateWarehouseRequestDto,
    GetWarehousesRequestDto,
    UpdateWarehouseRequestDto,
} from "./warehouse.dto";
import warehouseService from "./warehouse.service";

export class WarehouseController {
    @CreatedResponse()
    async createWarehouse(req: Request) {
        const dto = extractRequest<CreateWarehouseRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return warehouseService.createWarehouse({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async deleteWarehouse(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return warehouseService.deleteWarehouse({
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async getWarehouse(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return warehouseService.getWarehouse({
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async getWarehouses(req: Request) {
        const dto = extractRequest<GetWarehousesRequestDto>(req, "query");
        const jwtPayload = RequestContextService.getJwtPayload();
        return warehouseService.getWarehouses({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async updateWarehouse(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateWarehouseRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return warehouseService.updateWarehouse({
            ...dto,
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }
}

const warehouseController = new WarehouseController();
export default warehouseController;
