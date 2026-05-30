import { DeliveryEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class DeliveryRepository extends BaseRepository<DeliveryEntity> {
    constructor() {
        super(DeliveryEntity);
    }
}

const deliveryRepository = new DeliveryRepository();
export default deliveryRepository;
