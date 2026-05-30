import { DeliveryZoneEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class DeliveryZoneRepository extends BaseRepository<DeliveryZoneEntity> {
    constructor() {
        super(DeliveryZoneEntity);
    }
}

const deliveryZoneRepository = new DeliveryZoneRepository();
export default deliveryZoneRepository;
