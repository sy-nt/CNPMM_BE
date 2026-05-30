import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import cartService from "./cart.service";

export class CartController {
    @CreatedResponse()
    async addItem(req: Request) {
        const body = extractRequest<{ quantity: number; skuId: string }>(
            req,
            "body",
        );
        const userId = RequestContextService.getJwtPayload()!.userId;
        return cartService.addItem({ ...body, userId });
    }

    @OkResponse()
    async clearCart() {
        const userId = RequestContextService.getJwtPayload()!.userId;
        await cartService.clearCart(userId);
        return cartService.getCart({ userId });
    }

    @OkResponse()
    async getCart() {
        const userId = RequestContextService.getJwtPayload()!.userId;
        return cartService.getCart({ userId });
    }

    @OkResponse()
    async removeItem(req: Request) {
        const { skuId } = extractRequest<{ skuId: string }>(req, "params");
        const userId = RequestContextService.getJwtPayload()!.userId;
        return cartService.removeItem({ skuId, userId });
    }

    @OkResponse()
    async updateItem(req: Request) {
        const { skuId } = extractRequest<{ skuId: string }>(req, "params");
        const { quantity } = extractRequest<{ quantity: number }>(req, "body");
        const userId = RequestContextService.getJwtPayload()!.userId;
        return cartService.updateItem({ quantity, skuId, userId });
    }
}

const cartController = new CartController();
export default cartController;
