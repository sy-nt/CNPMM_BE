import AppDataSource from "@domain/db/mysql";
import { CategoryEntity } from "@domain/entities/category.entity";
import { DeliveryZoneEntity } from "@domain/entities/deliveryZone.entity";
import { RoleEntity } from "@domain/entities/role.entity";
import appLogger from "@shared/lib/logger";
import { sleep } from "@shared/utils/sleep";

import { seedCategories } from "./category";
import { seedDeliveryCatalog } from "./delivery";
import { seedPermissions } from "./permission";
import { seedRoles } from "./role";
import { seedRolePermissions } from "./role-permission";

const isFirstRun = async () => {
    const isInitialized = AppDataSource.isInitialized;
    if (!isInitialized) await sleep(5000);

    const roleCount = await AppDataSource.manager
        .getRepository(RoleEntity)
        .count();
    return roleCount === 0;
};

const shouldSeedCategories = async () => {
    const count = await AppDataSource.manager
        .getRepository(CategoryEntity)
        .count();
    return count === 0;
};

const shouldSeedDeliveryCatalog = async () => {
    const count = await AppDataSource.manager
        .getRepository(DeliveryZoneEntity)
        .count();
    return count === 0;
};

const seed = async () => {
    const firstRun = await isFirstRun();
    if (firstRun) {
        await AppDataSource.transaction(async (manager) => {
            const roles = await seedRoles(manager);
            const permissions = await seedPermissions(manager);
            await seedRolePermissions(manager, roles, permissions);
        });
    }

    if (await shouldSeedCategories()) {
        await AppDataSource.transaction(async (manager) => {
            await seedCategories(manager);
        });
    }

    if (await shouldSeedDeliveryCatalog()) {
        await AppDataSource.transaction(async (manager) => {
            await seedDeliveryCatalog(manager);
        });
    }
};

seed().catch((err) => {
    appLogger.error("seed failed", { error: err });
    process.exit(1);
});
