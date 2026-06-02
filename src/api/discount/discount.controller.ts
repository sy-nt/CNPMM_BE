import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreateGlobalDiscountRequestDto,
    CreateShopDiscountRequestDto,
    GetDiscountsRequestDto,
    GetMyClaimsRequestDto,
    UpdateDiscountRequestDto,
} from "./discount.dto";
import discountService from "./discount.service";

export class DiscountController {
    @CreatedResponse()
    async claimDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.claimDiscount({
            callerUserId: jwt.userId,
            id,
        });
    }

    @CreatedResponse()
    async createGlobalDiscount(req: Request) {
        const dto = extractRequest<CreateGlobalDiscountRequestDto>(req, "body");
        return discountService.createGlobalDiscount(dto);
    }

    @CreatedResponse()
    async createShopDiscount(req: Request) {
        const dto = extractRequest<CreateShopDiscountRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.createShopDiscount({
            ...dto,
            shopId: jwt.assignedShopId!,
        });
    }

    @OkResponse()
    async deleteDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.deleteDiscount({
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            id,
        });
    }

    @OkResponse()
    async getDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.getDiscount({
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            id,
        });
    }

    @OkResponse()
    async getDiscounts(req: Request) {
        const query = extractRequest<GetDiscountsRequestDto>(req, "query");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.getDiscounts({
            ...query,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
        });
    }

    @OkResponse()
    async getMyClaims(req: Request) {
        const query = extractRequest<GetMyClaimsRequestDto>(req, "query");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.getMyClaims({
            ...query,
            callerUserId: jwt.userId,
        });
    }

    @OkResponse()
    async getShopDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.getDiscount({
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId!,
            id,
        });
    }

    @OkResponse()
    async getShopDiscounts(req: Request) {
        const query = extractRequest<GetDiscountsRequestDto>(req, "query");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.getDiscounts({
            ...query,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId!,
        });
    }

    @OkResponse()
    async updateDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateDiscountRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.updateDiscount({
            ...dto,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            id,
        });
    }

    @OkResponse()
    async updateShopDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateDiscountRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountService.updateDiscount({
            ...dto,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId!,
            id,
        });
    }
}

const discountController = new DiscountController();
export default discountController;
