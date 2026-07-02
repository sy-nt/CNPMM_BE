import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { BadRequestError } from "@shared/lib/http/httpError";
import { Request } from "express";

import { AddressError } from "../address.constants";
import {
    CreateShopAddressRequestDto,
    UpdateShopAddressRequestDto,
} from "../address.dto";
import { addressShopService } from "../services";

export class AddressShopController {
    @OkResponse()
    async createAddress(req: Request) {
        const body = extractRequest<CreateShopAddressRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload()!;
        const shopId = jwtPayload.assignedShopId;
        if (!shopId) {
            throw new BadRequestError(AddressError.NOT_SHOP_MEMBER);
        }
        return await addressShopService.createShopAddress({
            ...body,
            shopId,
            userId: jwtPayload.userId,
        });
    }
    @OkResponse()
    async deleteAddress(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload()!;
        const shopId = jwtPayload.assignedShopId;
        if (!shopId) {
            throw new BadRequestError(AddressError.NOT_SHOP_MEMBER);
        }
        return await addressShopService.deleteShopAddress({
            id,
            shopId,
        });
    }

    @OkResponse()
    async getAddresses() {
        const jwtPayload = RequestContextService.getJwtPayload()!;
        const shopId = jwtPayload.assignedShopId;
        if (!shopId) {
            throw new BadRequestError(AddressError.NOT_SHOP_MEMBER);
        }
        return await addressShopService.getShopAddresses({
            shopId,
        });
    }

    @OkResponse()
    async updateAddress(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const body = extractRequest<UpdateShopAddressRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload()!;
        const shopId = jwtPayload.assignedShopId;
        if (!shopId) {
            throw new BadRequestError(AddressError.NOT_SHOP_MEMBER);
        }
        return await addressShopService.updateShopAddress({
            ...body,
            id,
            shopId,
        });
    }
}

const addressShopController = new AddressShopController();
export { addressShopController };
