import { OrderEntity, OrderStatus } from "@domain/entities";
import { In } from "typeorm";

import { BaseRepository } from "./base";

export class OrderRepository extends BaseRepository<OrderEntity> {
    constructor() {
        super(OrderEntity);
    }

    findByUserAndStatus = async (
        userId: string,
        statuses: OrderStatus[],
    ): Promise<OrderEntity[]> => {
        return this.repository.find({
            where: { status: In(statuses), userId },
        });
    };

    transitionToCancelled = async (params: {
        cancellationReason?: string;
        cancelledAt: Date;
        cancelledByRoleName: string;
        cancelledByUserId?: string;
        fromStatuses: OrderStatus[];
        orderId: string;
    }): Promise<number> => {
        const manager = await this._entityManager();
        const result = await manager
            .createQueryBuilder()
            .update(OrderEntity)
            .set({
                cancellationReason: params.cancellationReason,
                cancelledAt: params.cancelledAt,
                cancelledByRoleName: params.cancelledByRoleName,
                cancelledByUserId: params.cancelledByUserId,
                status: OrderStatus.CANCELLED,
            })
            .where("id = :orderId", { orderId: params.orderId })
            .andWhere("status IN (:...fromStatuses)", {
                fromStatuses: params.fromStatuses,
            })
            .execute();
        return result.affected ?? 0;
    };
}

const orderRepository = new OrderRepository();
export default orderRepository;
