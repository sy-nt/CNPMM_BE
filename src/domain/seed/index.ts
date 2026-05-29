import AppDataSource from "@domain/db/mysql";
import { CategoryEntity } from "@domain/entities/category.entity";
import { RoleEntity } from "@domain/entities/role.entity";
import { sleep } from "@shared/utils/sleep";

import { seedCategories } from "./category";
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
};

seed();
