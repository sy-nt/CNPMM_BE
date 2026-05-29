import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    AssignWorkerRequestDto,
    GetShopsRequestDto,
    RegisterShopRequestDto,
    UpdateShopRequestDto,
    UpdateShopStatusRequestDto,
} from "./shop.dto";
import shopService from "./shop.service";

export class ShopController {
    @OkResponse()
    async assignWorker(req: Request) {
        const dto = extractRequest<AssignWorkerRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return shopService.assignWorker({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
            shopOwnerId: jwtPayload!.userId,
        });
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
    async registerShop(req: Request) {
        const dto = extractRequest<RegisterShopRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return shopService.registerShop({
            ...dto,
            ownerId: jwtPayload!.userId,
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
