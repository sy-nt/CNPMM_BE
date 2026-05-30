import { AddressEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class AddressRepository extends BaseRepository<AddressEntity> {
    constructor() {
        super(AddressEntity);
    }

    lockPersonalPrimary = async (userId: string): Promise<void> => {
        const manager = await this._entityManager();
        await manager
            .createQueryBuilder(AddressEntity, "a")
            .setLock("pessimistic_write")
            .where("a.user_id = :userId", { userId })
            .andWhere("a.shop_id IS NULL")
            .getMany();
    };

    lockShopPrimary = async (shopId: string): Promise<void> => {
        const manager = await this._entityManager();
        await manager
            .createQueryBuilder(AddressEntity, "a")
            .setLock("pessimistic_write")
            .where("a.shop_id = :shopId", { shopId })
            .getMany();
    };
}

const addressRepository = new AddressRepository();
export default addressRepository;
