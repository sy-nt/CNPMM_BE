import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CheckoutPreviewRequestDto,
    GetOrdersRequestDto,
    PlaceOrderRequestDto,
    UpdateOrderStatusRequestDto,
} from "./order.dto";
import orderService from "./order.service";

export class OrderController {
    @OkResponse()
    async cancelOrder(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const body = extractRequest<{ reason?: string }>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderService.cancelOrder({
            callerShopId: jwt.assignedShopId,
            callerUserId: jwt.userId,
            id,
            reason: body.reason,
        });
    }

    @OkResponse()
    async getOrder(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderService.getOrder({
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
        return orderService.getOrders({
            ...query,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            callerUserId: jwt.userId,
        });
    }

    @CreatedResponse()
    async placeOrder(req: Request) {
        const dto = extractRequest<PlaceOrderRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderService.placeOrder({ ...dto, callerUserId: jwt.userId });
    }

    @OkResponse()
    async previewCheckout(req: Request) {
        const dto = extractRequest<CheckoutPreviewRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderService.previewCheckout({
            ...dto,
            callerUserId: jwt.userId,
        });
    }

    @OkResponse()
    async updateOrderStatus(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateOrderStatusRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderService.updateOrderStatus({
            ...dto,
            callerRoleId: jwt.roleId,
            callerShopId: jwt.assignedShopId,
            id,
        });
    }
}

const orderController = new OrderController();
export default orderController;
