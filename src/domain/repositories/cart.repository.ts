import { CartEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class CartRepository extends BaseRepository<CartEntity> {
    constructor() {
        super(CartEntity);
    }

    findOneByIdForUpdate = async (id: string): Promise<CartEntity | null> => {
        const manager = await this._entityManager();
        return manager
            .createQueryBuilder(CartEntity, "c")
            .setLock("pessimistic_write")
            .where("c.id = :id", { id })
            .getOne();
    };
}

const cartRepository = new CartRepository();
export default cartRepository;
