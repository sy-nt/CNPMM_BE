import AppDataSource from "@domain/db/mysql";
import { CategoryEntity } from "@domain/entities/category.entity";
import { DeliveryZoneEntity } from "@domain/entities/deliveryZone.entity";
import { RoleEntity } from "@domain/entities/role.entity";
import { UserEntity } from "@domain/entities/user.entity";
import appLogger from "@shared/lib/logger";
import { sleep } from "@shared/utils/sleep";
import { EntityTarget, ObjectLiteral } from "typeorm";

import { seedCartsAndOrders } from "./cartOrder";
import { seedCategories } from "./category";
import { seedDeliveryCatalog } from "./delivery";
import { seedDiscounts } from "./discount";
import { seedPermissions } from "./permission";
import { seedProducts } from "./product";
import { seedRoles } from "./role";
import { seedRolePermissions } from "./role-permission";
import { seedShops } from "./shop";
import { seedUsers } from "./user";
import { seedWarehouses } from "./warehouse";

const DATA_SOURCE_WAIT_MS = 5000;

const isEntityEmpty = async <T extends ObjectLiteral>(
    entity: EntityTarget<T>,
): Promise<boolean> => {
    const count = await AppDataSource.manager.getRepository(entity).count();
    return count === 0;
};

const seedDemoData = async () => {
    await AppDataSource.transaction(async (manager) => {
        const users = await seedUsers(manager);
        const shopsBySlug = await seedShops(manager, users);
        const warehousesByShopId = await seedWarehouses(manager, shopsBySlug);
        const skusByShopId = await seedProducts(
            manager,
            shopsBySlug,
            warehousesByShopId,
        );
        await seedDiscounts(manager, shopsBySlug);
        await seedCartsAndOrders(manager, {
            customerIdsByEmail: users.customerIdsByEmail,
            shopsBySlug,
            skusByShopId,
            warehousesByShopId,
        });
    });
    appLogger.info("seed: demo dataset created");
};

const seedReferenceData = async () => {
    if (await isEntityEmpty(RoleEntity)) {
        await AppDataSource.transaction(async (manager) => {
            const roles = await seedRoles(manager);
            const permissions = await seedPermissions(manager);
            await seedRolePermissions(manager, roles, permissions);
        });
    }
    if (await isEntityEmpty(CategoryEntity)) {
        await AppDataSource.transaction((manager) => seedCategories(manager));
    }
    if (await isEntityEmpty(DeliveryZoneEntity)) {
        await AppDataSource.transaction((manager) =>
            seedDeliveryCatalog(manager),
        );
    }
};

const seed = async () => {
    if (!AppDataSource.isInitialized) await sleep(DATA_SOURCE_WAIT_MS);
    await seedReferenceData();
    if (await isEntityEmpty(UserEntity)) {
        await seedDemoData();
    }
};

seed().catch((err) => {
    appLogger.error("seed failed", { error: err });
    process.exit(1);
});
