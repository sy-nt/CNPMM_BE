import {
    DeliveryMethodEntity,
    DeliveryZoneEntity,
    DeliveryZoneRateEntity,
} from "@domain/entities";
import { EntityManager } from "typeorm";

const ZONE_DEFINITIONS: {
    code: string;
    description: string;
    displayOrder: number;
    name: string;
}[] = [
    {
        code: "SAME_DISTRICT",
        description: "Origin and destination are in the same district",
        displayOrder: 0,
        name: "Same district",
    },
    {
        code: "SAME_CITY",
        description:
            "Origin and destination are in the same city but different districts",
        displayOrder: 1,
        name: "Same city",
    },
    {
        code: "SAME_STATE",
        description:
            "Origin and destination are in the same state but different cities",
        displayOrder: 2,
        name: "Same state",
    },
    {
        code: "SAME_COUNTRY",
        description:
            "Origin and destination are in the same country but different states",
        displayOrder: 3,
        name: "Same country",
    },
    {
        code: "CROSS_COUNTRY",
        description: "Origin and destination are in different countries",
        displayOrder: 4,
        name: "Cross country",
    },
];

const DEFAULT_METHOD = {
    code: "STANDARD",
    description:
        "Default delivery method backed by the zone-table rate strategy",
    etaMaxDays: 5,
    etaMinDays: 2,
    isActive: true,
    name: "Standard",
    providerCode: "zone-table",
};

const ZONE_FEES_VND: Record<string, string> = {
    CROSS_COUNTRY: "150000.00",
    SAME_CITY: "25000.00",
    SAME_COUNTRY: "60000.00",
    SAME_DISTRICT: "15000.00",
    SAME_STATE: "40000.00",
};

export const seedDeliveryCatalog = async (manager: EntityManager) => {
    const zoneRepo = manager.getRepository(DeliveryZoneEntity);
    const methodRepo = manager.getRepository(DeliveryMethodEntity);
    const rateRepo = manager.getRepository(DeliveryZoneRateEntity);

    const zones = await zoneRepo.save(zoneRepo.create(ZONE_DEFINITIONS));
    const method = await methodRepo.save(methodRepo.create(DEFAULT_METHOD));
    const rateRows = zones.map((zone) => ({
        baseFee: ZONE_FEES_VND[zone.code] ?? "0.00",
        deliveryMethodId: method.id,
        deliveryZoneId: zone.id,
    }));
    await rateRepo.save(rateRepo.create(rateRows));
};
