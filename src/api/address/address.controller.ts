import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreateAddressRequestDto,
    GetAddressesRequestDto,
    UpdateAddressRequestDto,
} from "./address.dto";
import addressService from "./address.service";

export class AddressController {
    @CreatedResponse()
    async createAddress(req: Request) {
        const dto = extractRequest<CreateAddressRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return addressService.createAddress({
            ...dto,
            shopId: jwtPayload!.assignedShopId,
            userId: jwtPayload!.userId,
        });
    }

    @OkResponse()
    async deleteAddress(req: Request) {
        const dto = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return addressService.deleteAddress({
            id: dto.id,
            shopId: jwtPayload!.assignedShopId,
            userId: jwtPayload!.userId,
        });
    }

    @OkResponse()
    async getAddresses(req: Request) {
        const dto = extractRequest<GetAddressesRequestDto>(req, "query");
        const jwtPayload = RequestContextService.getJwtPayload();
        return addressService.getAddresses({
            ...dto,
            shopId: jwtPayload!.assignedShopId,
            userId: jwtPayload!.userId,
        });
    }

    @OkResponse()
    async updateAddress(req: Request) {
        const params = extractRequest<{ id: string }>(req, "params");
        const body = extractRequest<UpdateAddressRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return addressService.updateAddress({
            ...body,
            id: params.id,
            shopId: jwtPayload!.assignedShopId,
            userId: jwtPayload!.userId,
        });
    }
}

const addressController = new AddressController();
export default addressController;
