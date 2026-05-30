import { DiscountRedemptionEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class DiscountRedemptionRepository extends BaseRepository<DiscountRedemptionEntity> {
    constructor() {
        super(DiscountRedemptionEntity);
    }

    countByDiscount = async (discountId: string): Promise<number> => {
        return this.repository.count({ where: { discountId } });
    };

    countByDiscountAndUser = async (
        discountId: string,
        userId: string,
    ): Promise<number> => {
        return this.repository.count({ where: { discountId, userId } });
    };

    findByOrderId = async (
        orderId: string,
    ): Promise<DiscountRedemptionEntity[]> => {
        return this.repository.find({ where: { orderId } });
    };
}

const discountRedemptionRepository = new DiscountRedemptionRepository();
export default discountRedemptionRepository;
