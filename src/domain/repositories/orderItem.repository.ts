import { OrderItemEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class OrderItemRepository extends BaseRepository<OrderItemEntity> {
    constructor() {
        super(OrderItemEntity);
    }

    findByOrderId = async (orderId: string): Promise<OrderItemEntity[]> => {
        return this.repository.find({ where: { orderId } });
    };
}

const orderItemRepository = new OrderItemRepository();
export default orderItemRepository;
