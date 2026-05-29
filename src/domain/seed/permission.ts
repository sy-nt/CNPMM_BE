import { PermissionEntity } from "@domain/entities/permission.entity";
import { RBAC_PERMISSIONS } from "@shared/lib/rbac/rbac.constants";
import { EntityManager } from "typeorm";

export const seedPermissions = async (manager: EntityManager) => {
    const permissions = Object.values(RBAC_PERMISSIONS);
    return manager
        .getRepository(PermissionEntity)
        .save(
            manager
                .getRepository(PermissionEntity)
                .create(permissions.map((p) => ({ description: p, name: p }))),
        );
};
