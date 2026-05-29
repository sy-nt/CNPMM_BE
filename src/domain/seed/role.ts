import { RoleEntity } from "@domain/entities/role.entity";
import { RBAC_SYSTEM_ROLES } from "@shared/lib/rbac/rbac.constants";
import { EntityManager } from "typeorm";

export const seedRoles = async (manager: EntityManager) => {
    const roleRepository = manager.getRepository(RoleEntity);
    return roleRepository.save(
        roleRepository.create(
            Object.values(RBAC_SYSTEM_ROLES).map((role) => ({
                description: role,
                isSystemRole: true,
                name: role,
            })),
        ),
    );
};
