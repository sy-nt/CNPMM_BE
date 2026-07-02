import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    GetMyClaimsRequestDto,
    ListPlatformDiscountsRequestDto,
} from "../discount.dto";
import { discountUserService } from "../services";

export class DiscountUserController {
    @CreatedResponse()
    async claimDiscount(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountUserService.claimDiscount({
            callerUserId: jwt.userId,
            id,
        });
    }

    @OkResponse()
    async getMyClaims(req: Request) {
        const query = extractRequest<GetMyClaimsRequestDto>(req, "query");
        const jwt = RequestContextService.getJwtPayload()!;
        return discountUserService.getMyClaims({
            ...query,
            callerUserId: jwt.userId,
        });
    }

    @OkResponse()
    async listPlatformDiscounts(req: Request) {
        const query = extractRequest<ListPlatformDiscountsRequestDto>(
            req,
            "query",
        );
        return discountUserService.listPlatformDiscounts(query);
    }
}

const discountUserController = new DiscountUserController();
export default discountUserController;
