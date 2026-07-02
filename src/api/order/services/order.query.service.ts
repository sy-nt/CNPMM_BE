import { NotFoundError } from "@shared/lib/http/httpError";

import { OrderError } from "../order.constants";
import {
    GetOrderRequestDto,
    GetOrdersRequestDto,
    GetOrdersResponseDto,
    OrderResponseDto,
} from "../order.dto";
import { OrderBaseService } from "./order.base.service";

export class OrderQueryService extends OrderBaseService {
    async getOrder(dto: GetOrderRequestDto): Promise<OrderResponseDto> {
        const order = await this._getOrderOrThrow(dto.id);
        const hasGlobalAccess = await this._hasGlobalOrderAccess(
            dto.callerRoleId,
        );
        this._assertOrderAccess(
            order,
            dto.callerShopId,
            dto.callerUserId,
            hasGlobalAccess,
        );
        return this._buildOrderResponse(order);
    }

    async getOrders(dto: GetOrdersRequestDto): Promise<GetOrdersResponseDto> {
        const hasGlobalAccess = await this._hasGlobalOrderAccess(
            dto.callerRoleId,
        );
        if (hasGlobalAccess && dto.shopId) {
            await this._ensureShopExists(dto.shopId);
        }
        const where = this._buildOrdersWhere(dto, hasGlobalAccess);
        if (where === null) {
            return this._emptyPage(dto);
        }
        const result = await this.repositories.order.paginate(
            { where },
            {
                limit: dto.limit,
                orderBy: dto.orderBy,
                page: dto.page,
                sort: dto.sort,
            },
        );
        const items = await Promise.all(
            result.items.map((order) => this._buildOrderResponse(order)),
        );
        return { ...result, items };
    }

    private _buildOrdersWhere(
        dto: GetOrdersRequestDto,
        hasGlobalAccess: boolean,
    ): null | Record<string, unknown> {
        const base: Record<string, unknown> = {};
        if (dto.status) base.status = dto.status;
        if (hasGlobalAccess) {
            if (dto.shopId) base.shopId = dto.shopId;
            return base;
        }
        if (dto.callerShopId) {
            return { ...base, shopId: dto.callerShopId };
        }
        if (dto.callerUserId) {
            return { ...base, userId: dto.callerUserId };
        }
        return null;
    }

    private _emptyPage(dto: GetOrdersRequestDto): GetOrdersResponseDto {
        return {
            currentPage: dto.page,
            items: [],
            limit: dto.limit,
            total: 0,
            totalPage: 0,
        };
    }

    private async _ensureShopExists(shopId: string) {
        const shop = await this.repositories.shop.findOne({
            select: { id: true },
            where: { id: shopId },
        });
        if (!shop) {
            throw new NotFoundError(OrderError.SHOP_NOT_FOUND);
        }
    }
}

const orderQueryService = new OrderQueryService();
export { orderQueryService };
