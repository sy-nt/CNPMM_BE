import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import { CheckoutPreviewRequestDto, PlaceOrderRequestDto } from "../order.dto";
import { orderCheckoutService } from "../services";

export class OrderCheckoutController {
    @CreatedResponse()
    async placeOrder(req: Request) {
        const dto = extractRequest<PlaceOrderRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderCheckoutService.placeOrder({
            ...dto,
            callerUserId: jwt.userId,
        });
    }

    @OkResponse()
    async previewCheckout(req: Request) {
        const dto = extractRequest<CheckoutPreviewRequestDto>(req, "body");
        const jwt = RequestContextService.getJwtPayload()!;
        return orderCheckoutService.previewCheckout({
            ...dto,
            callerUserId: jwt.userId,
        });
    }
}

const orderCheckoutController = new OrderCheckoutController();
export { orderCheckoutController };
