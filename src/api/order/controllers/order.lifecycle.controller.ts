import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import { UpdateOrderStatusRequestDto } from "../order.dto";
import { orderLifecycleService } from "../services";

export class OrderLifecycleController {
    @OkResponse()
    async cancelOrder(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const body = extractRequest<{ reason?: string }>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderLifecycleService.cancelOrder({
            callerShopId: jwt.assignedShopId,
            callerUserId: jwt.userId,
            id,
            reason: body.reason,
        });
    }

    @OkResponse()
    async updateOrderStatus(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateOrderStatusRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderLifecycleService.updateOrderStatus({
            ...dto,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            id,
        });
    }
}

const orderLifecycleController = new OrderLifecycleController();
export { orderLifecycleController };
