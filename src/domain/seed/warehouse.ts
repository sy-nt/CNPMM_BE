import { AddressEntity } from "@domain/entities/address.entity";
import { WarehouseEntity } from "@domain/entities/warehouse.entity";
import { EntityManager } from "typeorm";

import { WAREHOUSE_FIXTURES } from "./fixtures";
import { SeededShop } from "./shop";

export interface SeededWarehouse {
    addressId: string;
    code: string;
    id: string;
    isDefault: boolean;
    shopId: string;
}

export const seedWarehouses = async (
    manager: EntityManager,
    shopsBySlug: Map<string, SeededShop>,
): Promise<Map<string, SeededWarehouse[]>> => {
    const addressRepository = manager.getRepository(AddressEntity);
    const warehouseRepository = manager.getRepository(WarehouseEntity);

    const result = new Map<string, SeededWarehouse[]>();
    for (const [slug, fixtures] of Object.entries(WAREHOUSE_FIXTURES)) {
        const shop = shopsBySlug.get(slug);
        if (!shop) continue;

        const addressRows = fixtures.map((fixture) => ({
            ...fixture.address,
            isPrimary: false,
            shopId: shop.shopId,
            userId: shop.ownerId,
        }));
        const savedAddresses = await addressRepository.save(
            addressRepository.create(addressRows),
        );

        const warehouseRows = fixtures.map((fixture, index) => ({
            addressId: savedAddresses[index].id,
            code: fixture.code,
            isActive: true,
            isDefault: fixture.isDefault,
            name: fixture.name,
            shopId: shop.shopId,
        }));
        const savedWarehouses = await warehouseRepository.save(
            warehouseRepository.create(warehouseRows),
        );

        result.set(
            shop.shopId,
            savedWarehouses.map((w) => ({
                addressId: w.addressId,
                code: w.code,
                id: w.id,
                isDefault: w.isDefault,
                shopId: w.shopId,
            })),
        );
    }
    return result;
};
