import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    AdminGetShopsRequestDto,
    AssignWorkerRequestDto,
    GetShopsRequestDto,
    RegisterShopRequestDto,
    UnassignWorkerRequestDto,
    UpdateShopRequestDto,
    UpdateShopStatusRequestDto,
} from "./shop.dto";
import shopService from "./shop.service";

export class ShopController {
    @OkResponse()
    async adminGetShops(req: Request) {
        const dto = extractRequest<AdminGetShopsRequestDto>(req, "query");
        return shopService.adminGetShops(dto);
    }

    @OkResponse()
    async assignWorker(req: Request) {
        const dto = extractRequest<AssignWorkerRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return shopService.assignWorker({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async getMyShopDetails() {
        const jwtPayload = RequestContextService.getJwtPayload();
        return shopService.getShopDetails(jwtPayload!.assignedShopId!);
    }

    @OkResponse()
    async getShop(req: Request) {
        const { idOrSlug } = extractRequest<{ idOrSlug: string }>(
            req,
            "params",
        );
        return shopService.getShop(idOrSlug);
    }

    @OkResponse()
    async getShopDetails(req: Request) {
        const { idOrSlug } = extractRequest<{ idOrSlug: string }>(
            req,
            "params",
        );
        return shopService.getShopDetails(idOrSlug);
    }

    @OkResponse()
    async getShops(req: Request) {
        const dto = extractRequest<GetShopsRequestDto>(req, "query");
        return shopService.getShops(dto);
    }

    @OkResponse()
    async getWorkers() {
        const jwtPayload = RequestContextService.getJwtPayload();
        return shopService.getWorkers(jwtPayload!.assignedShopId!);
    }

    @OkResponse()
    async registerShop(req: Request) {
        const dto = extractRequest<RegisterShopRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return shopService.registerShop({
            ...dto,
            ownerId: jwtPayload!.userId,
        });
    }

    @OkResponse()
    async unassignWorker(req: Request) {
        const dto = extractRequest<UnassignWorkerRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return shopService.unassignWorker({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async updateShop(req: Request) {
        const dto = extractRequest<UpdateShopRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return shopService.updateShop({
            ...dto,
            id: jwtPayload!.assignedShopId!,
            ownerId: jwtPayload!.userId,
        });
    }

    @OkResponse()
    async updateShopStatus(req: Request) {
        const dto = extractRequest<UpdateShopStatusRequestDto>(req, "body");
        return shopService.updateStatus(dto);
    }
}

const shopController = new ShopController();
export default shopController;
