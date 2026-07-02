import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import { GetOrdersRequestDto } from "../order.dto";
import { orderQueryService } from "../services";

export class OrderQueryController {
    @OkResponse()
    async getOrder(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderQueryService.getOrder({
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            callerUserId: jwt.userId,
            id,
        });
    }

    @OkResponse()
    async getOrders(req: Request) {
        const query = extractRequest<GetOrdersRequestDto>(req, "query");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderQueryService.getOrders({
            ...query,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            callerUserId: jwt.userId,
        });
    }
}

const orderQueryController = new OrderQueryController();
export { orderQueryController };
