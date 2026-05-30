import { DeliveryZoneRateEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class DeliveryZoneRateRepository extends BaseRepository<DeliveryZoneRateEntity> {
    constructor() {
        super(DeliveryZoneRateEntity);
    }
}

const deliveryZoneRateRepository = new DeliveryZoneRateRepository();
export default deliveryZoneRateRepository;
