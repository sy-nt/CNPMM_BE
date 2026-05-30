import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreatePersonalAddressRequestDto,
    CreateShopAddressRequestDto,
    UpdatePersonalAddressRequestDto,
    UpdateShopAddressRequestDto,
} from "./address.dto";
import addressService from "./address.service";

export class AddressController {
    @CreatedResponse()
    async createPersonalAddress(req: Request) {
        const dto = extractRequest<CreatePersonalAddressRequestDto>(
            req,
            "body",
        );
        const jwt = RequestContextService.getJwtPayload()!;
        return addressService.createPersonalAddress({
            ...dto,
            userId: jwt.userId,
        });
    }

    @CreatedResponse()
    async createShopAddress(req: Request) {
        const dto = extractRequest<CreateShopAddressRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return addressService.createShopAddress({
            ...dto,
            shopId: jwt.assignedShopId!,
            userId: jwt.userId,
        });
    }

    @OkResponse()
    async deletePersonalAddress(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return addressService.deletePersonalAddress({
            id,
            userId: jwt.userId,
        });
    }

    @OkResponse()
    async deleteShopAddress(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return addressService.deleteShopAddress({
            id,
            shopId: jwt.assignedShopId!,
        });
    }

    @OkResponse()
    async getPersonalAddresses(_req: Request) {
        const jwt = RequestContextService.getJwtPayload()!;
        return addressService.getPersonalAddresses({ userId: jwt.userId });
    }

    @OkResponse()
    async getShopAddresses(_req: Request) {
        const jwt = RequestContextService.getJwtPayload()!;
        return addressService.getShopAddresses({
            shopId: jwt.assignedShopId!,
        });
    }

    @OkResponse()
    async updatePersonalAddress(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const body = extractRequest<UpdatePersonalAddressRequestDto>(
            req,
            "body",
        );
        const jwt = RequestContextService.getJwtPayload()!;
        return addressService.updatePersonalAddress({
            ...body,
            id,
            userId: jwt.userId,
        });
    }

    @OkResponse()
    async updateShopAddress(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const body = extractRequest<UpdateShopAddressRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return addressService.updateShopAddress({
            ...body,
            id,
            shopId: jwt.assignedShopId!,
        });
    }
}

const addressController = new AddressController();
export default addressController;
