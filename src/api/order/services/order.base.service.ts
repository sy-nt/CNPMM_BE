import { AddressEntity, OrderEntity, OrderItemEntity } from "@domain/entities";
import { BaseService } from "@shared/lib/base/service";
import { ForbiddenError, NotFoundError } from "@shared/lib/http/httpError";
import rbacService from "@shared/lib/rbac/rbac.service";

import { OrderError } from "../order.constants";
import { OrderResponseDto } from "../order.dto";

export abstract class OrderBaseService extends BaseService {
    protected _aggregateBySpu(
        rows: Array<{ qty: number; spuId: string }>,
    ): Map<string, number> {
        const totals = new Map<string, number>();
        for (const row of rows) {
            totals.set(row.spuId, (totals.get(row.spuId) ?? 0) + row.qty);
        }
        return totals;
    }

    protected _assertOrderAccess(
        order: OrderEntity,
        callerShopId: string | undefined,
        callerUserId: string | undefined,
        hasGlobalAccess: boolean,
    ): void {
        if (hasGlobalAccess) return;
        if (callerUserId && order.userId === callerUserId) return;
        if (callerShopId && order.shopId === callerShopId) return;
        throw new ForbiddenError(OrderError.ORDER_FORBIDDEN);
    }

    protected async _buildOrderResponse(
        order: OrderEntity,
    ): Promise<OrderResponseDto> {
        console.log(order.createdAt.toISOString());
        const items = await this.repositories.orderItem.findByOrderId(order.id);
        return {
            appliedDiscounts: {
                delivery: order.deliveryDiscountId
                    ? {
                          amount: order.deliveryDiscountAmount,
                          discountId: order.deliveryDiscountId,
                      }
                    : undefined,
                items: order.itemsDiscountId
                    ? {
                          amount: order.itemsDiscountAmount,
                          discountId: order.itemsDiscountId,
                      }
                    : undefined,
            },
            cancellationReason: order.cancellationReason,
            cancelledAt: order.cancelledAt,
            createdAt: order.createdAt,
            deliveryFee: order.deliveryFee,
            deliveryId: order.deliveryId,
            destinationAddressId: order.destinationAddressId,
            destinationAddressSnapshot: order.destinationAddressSnapshot,
            id: order.id,
            items: items.map((item) => this._toOrderItemResponse(item)),
            itemsSubtotal: order.itemsSubtotal,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            shopId: order.shopId,
            status: order.status,
            totalAmount: order.totalAmount,
            userId: order.userId,
        };
    }

    protected async _getOrderOrThrow(id: string): Promise<OrderEntity> {
        const order = await this.repositories.order.findOne({ where: { id } });
        if (!order) {
            throw new NotFoundError(OrderError.ORDER_NOT_FOUND);
        }
        return order;
    }

    protected async _hasGlobalOrderAccess(
        callerRoleId?: string,
    ): Promise<boolean> {
        const [isAdmin, isDeliveryAgent] = await Promise.all([
            rbacService.isAdmin(callerRoleId),
            rbacService.isDeliveryAgent(callerRoleId),
        ]);
        return isAdmin || isDeliveryAgent;
    }

    protected _snapshotAddress(address: AddressEntity) {
        return {
            addressLine: address.addressLine,
            city: address.city,
            country: address.country,
            district: address.district,
            latitude: address.latitude,
            longitude: address.longitude,
            name: address.name,
            state: address.state,
        };
    }

    protected _toOrderItemResponse(item: OrderItemEntity) {
        return {
            id: item.id,
            imageKeySnapshot: item.imageKeySnapshot,
            nameSnapshot: item.nameSnapshot,
            quantity: item.quantity,
            skuId: item.skuId,
            spuIdSnapshot: item.spuIdSnapshot,
            subtotal: item.subtotal,
            unitPriceSnapshot: item.unitPriceSnapshot,
            warehouseAllocation: item.warehouseAllocation,
        };
    }
}
