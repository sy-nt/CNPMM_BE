import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreateGlobalDiscountRequestDto,
    GetDiscountsRequestDto,
    UpdateDiscountRequestDto,
} from "../discount.dto";
import { discountAdminService, discountManagementService } from "../services";

export class DiscountAdminController {
    @CreatedResponse()
    async createGlobalDiscount(req: Request) {
        const dto = extractRequest<CreateGlobalDiscountRequestDto>(req, "body");
        return discountAdminService.createGlobalDiscount(dto);
    }

    @OkResponse()
    async deleteDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountManagementService.deleteDiscount({
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            id,
        });
    }

    @OkResponse()
    async getDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountManagementService.getDiscount({
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            id,
        });
    }

    @OkResponse()
    async getDiscounts(req: Request) {
        const query = extractRequest<GetDiscountsRequestDto>(req, "query");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountManagementService.getDiscounts({
            ...query,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
        });
    }

    @OkResponse()
    async updateDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateDiscountRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountManagementService.updateDiscount({
            ...dto,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            id,
        });
    }
}

const discountAdminController = new DiscountAdminController();
export default discountAdminController;
