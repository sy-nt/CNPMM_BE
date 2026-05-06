import AppDataSource from "@domain/db/mysql";
import { RoleEntity } from "@domain/entities/role.entity";
import { sleep } from "@shared/utils/sleep";

import { seedRoles } from "./role";

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
    if (firstRun) {
        await AppDataSource.transaction(async (manager) => {
            await seedRoles(manager);
        });
    }
};

seed();
