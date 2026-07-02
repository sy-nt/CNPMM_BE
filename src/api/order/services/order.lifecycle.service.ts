import deliveryService from "@api/delivery/delivery.service";
import discountService from "@api/discount/discount.service";
import {
    DeliveryStatus,
    OrderEntity,
    OrderItemEntity,
    OrderStatus,
    PaymentStatus,
} from "@domain/entities";
import { RequestContextService } from "@shared/lib/context";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
} from "@shared/lib/http/httpError";
import notificationService from "@ws/notification/notification.service";

import {
    ORDER_CANCELLABLE_BY_CUSTOMER,
    ORDER_CANCELLABLE_BY_SHOP,
    ORDER_CUSTOMER_CANCEL_WINDOW_MINUTES,
    ORDER_STATUS_TRANSITIONS,
    OrderCancelledByRole,
    OrderError,
} from "../order.constants";
import {
    CancelOrderRequestDto,
    OrderResponseDto,
    UpdateOrderStatusRequestDto,
} from "../order.dto";
import { OrderBaseService } from "./order.base.service";

export class OrderLifecycleService extends OrderBaseService {
    async cancelOrder(dto: CancelOrderRequestDto): Promise<OrderResponseDto> {
        const order = await this._getOrderOrThrow(dto.id);
        const cancelledByRole = this._resolveCancelRole(order, dto);
        this._assertCancelAllowed(order, cancelledByRole);
        const affected = await this.repositories.order.transitionToCancelled({
            cancellationReason: dto.reason,
            cancelledAt: new Date(),
            cancelledByRoleName: cancelledByRole,
            cancelledByUserId: dto.callerUserId,
            fromStatuses: Array.from(
                this._cancellableStatuses(cancelledByRole),
            ),
            orderId: order.id,
        });
        if (affected === 0) {
            return this._handleCancelLost(order.id);
        }
        const items = await this.repositories.orderItem.findByOrderId(order.id);
        await this._restockInventory(items);
        await this._decrementSoldCounts(items);
        await discountService.releaseRedemption(order.id);
        RequestContextService.registerAfterCommit(() => {
            notificationService.notifyOrderStatusChanged({
                id: order.id,
                previousStatus: order.status,
                shopId: order.shopId,
                status: OrderStatus.CANCELLED,
                userId: order.userId,
            });
        });
        return this._buildOrderResponse(await this._getOrderOrThrow(order.id));
    }

    async updateOrderStatus(
        dto: UpdateOrderStatusRequestDto,
    ): Promise<OrderResponseDto> {
        const order = await this._getOrderOrThrow(dto.id);
        const hasGlobalAccess = await this._hasGlobalOrderAccess(
            dto.callerRoleId,
        );
        this._assertOrderAccess(
            order,
            dto.callerShopId,
            undefined,
            hasGlobalAccess,
        );
        this._assertStatusTransition(order.status, dto.status);
        const previousStatus = order.status;
        const patch = this._buildStatusPatch(dto.status);
        await this.repositories.order.update({ id: order.id }, patch);
        if (order.deliveryId) {
            await this._advanceLinkedDelivery(order.deliveryId, dto.status);
        }
        RequestContextService.registerAfterCommit(() => {
            notificationService.notifyOrderStatusChanged({
                id: order.id,
                previousStatus,
                shopId: order.shopId,
                status: dto.status,
                userId: order.userId,
            });
        });
        return this._buildOrderResponse(await this._getOrderOrThrow(order.id));
    }

    private async _advanceLinkedDelivery(
        deliveryId: string,
        orderStatus: OrderStatus,
    ): Promise<void> {
        const nextDeliveryStatus = this._mapOrderToDeliveryStatus(orderStatus);
        if (!nextDeliveryStatus) return;
        await deliveryService.syncDeliveryStatusFromOrder({
            id: deliveryId,
            status: nextDeliveryStatus,
        });
    }

    private _assertCancelAllowed(
        order: OrderEntity,
        cancelledByRole: OrderCancelledByRole,
    ): void {
        const allowed =
            cancelledByRole === OrderCancelledByRole.CUSTOMER
                ? ORDER_CANCELLABLE_BY_CUSTOMER
                : ORDER_CANCELLABLE_BY_SHOP;
        if (!allowed.has(order.status)) {
            throw new BadRequestError(OrderError.ORDER_NOT_CANCELLABLE);
        }
        if (cancelledByRole === OrderCancelledByRole.CUSTOMER) {
            this._assertCustomerCancelWindow(order.createdAt);
        }
    }

    private _assertCustomerCancelWindow(placedAt: Date): void {
        const windowMs = ORDER_CUSTOMER_CANCEL_WINDOW_MINUTES * 60 * 1000;
        if (Date.now() - placedAt.getTime() > windowMs) {
            throw new BadRequestError(OrderError.ORDER_CANCEL_WINDOW_EXPIRED);
        }
    }

    private _assertStatusTransition(from: OrderStatus, to: OrderStatus): void {
        if (from === to) return;
        const allowed = ORDER_STATUS_TRANSITIONS[from] ?? [];
        if (!allowed.includes(to)) {
            throw new BadRequestError(OrderError.INVALID_STATUS_TRANSITION);
        }
    }

    private _buildStatusPatch(status: OrderStatus): Record<string, unknown> {
        const now = new Date();
        const patch: Record<string, unknown> = { status };
        if (status === OrderStatus.CONFIRMED) patch.confirmedAt = now;
        if (status === OrderStatus.PROCESSING) patch.processingAt = now;
        if (status === OrderStatus.SHIPPED) patch.shippedAt = now;
        if (status === OrderStatus.DELIVERED) patch.deliveredAt = now;
        if (status === OrderStatus.COMPLETED) {
            patch.completedAt = now;
            patch.paymentStatus = PaymentStatus.PAID;
        }
        return patch;
    }

    private _cancellableStatuses(role: OrderCancelledByRole): Set<OrderStatus> {
        if (role === OrderCancelledByRole.CUSTOMER) {
            return ORDER_CANCELLABLE_BY_CUSTOMER;
        }
        return ORDER_CANCELLABLE_BY_SHOP;
    }

    private async _decrementSoldCounts(
        items: OrderItemEntity[],
    ): Promise<void> {
        const totals = this._aggregateBySpu(
            items.map((item) => ({
                qty: item.quantity,
                spuId: item.spuIdSnapshot,
            })),
        );
        for (const [spuId, qty] of totals.entries()) {
            const affected = await this.repositories.spu.decrementSoldCount(
                spuId,
                qty,
            );
            if (affected !== 1) {
                this.logger.warn("Failed to decrement sold count", {
                    qty,
                    spuId,
                });
            }
        }
    }

    private async _handleCancelLost(
        orderId: string,
    ): Promise<OrderResponseDto> {
        const fresh = await this._getOrderOrThrow(orderId);
        if (fresh.status === OrderStatus.CANCELLED) {
            return this._buildOrderResponse(fresh);
        }
        throw new ConflictError(OrderError.ORDER_NOT_CANCELLABLE);
    }

    private _mapOrderToDeliveryStatus(
        orderStatus: OrderStatus,
    ): DeliveryStatus | null {
        if (orderStatus === OrderStatus.SHIPPED)
            return DeliveryStatus.IN_TRANSIT;
        if (orderStatus === OrderStatus.DELIVERED)
            return DeliveryStatus.DELIVERED;
        return null;
    }

    private _resolveCancelRole(
        order: OrderEntity,
        dto: CancelOrderRequestDto,
    ): OrderCancelledByRole {
        if (dto.callerUserId && order.userId === dto.callerUserId) {
            return OrderCancelledByRole.CUSTOMER;
        }
        if (dto.callerShopId && order.shopId === dto.callerShopId) {
            return OrderCancelledByRole.SHOP;
        }
        throw new ForbiddenError(OrderError.ORDER_FORBIDDEN);
    }

    private async _restockInventory(items: OrderItemEntity[]): Promise<void> {
        for (const item of items) {
            for (const alloc of item.warehouseAllocation ?? []) {
                const affected =
                    await this.repositories.inventory.adjustWithGuard({
                        delta: alloc.quantity,
                        skuId: item.skuId,
                        warehouseId: alloc.warehouseId,
                    });
                if (affected !== 1) {
                    throw new ConflictError(OrderError.RESTOCK_FAILED);
                }
            }
        }
    }
}

const orderLifecycleService = new OrderLifecycleService();
export { orderLifecycleService };
