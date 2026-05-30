import { CartItemEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class CartItemRepository extends BaseRepository<CartItemEntity> {
    constructor() {
        super(CartItemEntity);
    }
}

const cartItemRepository = new CartItemRepository();
export default cartItemRepository;
