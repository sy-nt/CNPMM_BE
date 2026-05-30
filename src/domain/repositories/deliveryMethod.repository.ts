import { DeliveryMethodEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class DeliveryMethodRepository extends BaseRepository<DeliveryMethodEntity> {
    constructor() {
        super(DeliveryMethodEntity);
    }
}

const deliveryMethodRepository = new DeliveryMethodRepository();
export default deliveryMethodRepository;
