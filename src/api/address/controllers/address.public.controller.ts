import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreatePersonalAddressRequestDto,
    UpdatePersonalAddressRequestDto,
} from "../address.dto";
import { addressPublicService } from "../services";

export class AddressPublicController {
    @OkResponse()
    async createAddress(req: Request) {
        const body = extractRequest<CreatePersonalAddressRequestDto>(
            req,
            "body",
        );
        const jwtPayload = RequestContextService.getJwtPayload()!;
        return await addressPublicService.createPersonalAddress({
            ...body,
            userId: jwtPayload.userId,
        });
    }

    @OkResponse()
    async deleteAddress(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload()!;
        return await addressPublicService.deletePersonalAddress({
            id,
            userId: jwtPayload.userId,
        });
    }

    @OkResponse()
    async getAddresses() {
        const jwtPayload = RequestContextService.getJwtPayload()!;
        return await addressPublicService.getPersonalAddresses({
            userId: jwtPayload.userId,
        });
    }

    @OkResponse()
    async updateAddress(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const body = extractRequest<UpdatePersonalAddressRequestDto>(
            req,
            "body",
        );
        const jwtPayload = RequestContextService.getJwtPayload()!;
        return await addressPublicService.updatePersonalAddress({
            ...body,
            id,
            userId: jwtPayload.userId,
        });
    }
}

const addressPublicController = new AddressPublicController();
export { addressPublicController };
