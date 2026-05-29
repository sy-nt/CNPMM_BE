import AppDataSource from "@domain/db/mysql";
import { RoleEntity } from "@domain/entities/role.entity";
import { sleep } from "@shared/utils/sleep";

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

const seed = async () => {
    const firstRun = await isFirstRun();
    if (!firstRun) return;

    await AppDataSource.transaction(async (manager) => {
        const roles = await seedRoles(manager);
        const permissions = await seedPermissions(manager);
        await seedRolePermissions(manager, roles, permissions);
    });
};

seed();
