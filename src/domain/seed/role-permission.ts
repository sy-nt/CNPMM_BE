import { PermissionEntity } from "@domain/entities/permission.entity";
import { RoleEntity } from "@domain/entities/role.entity";
import { RBAC_SYSTEM_ROLES_PERMISSIONS } from "@shared/lib/rbac/rbac.constants";
import { EntityManager } from "typeorm";

export const seedRolePermissions = async (
    manager: EntityManager,
    roles: RoleEntity[],
    permissions: PermissionEntity[],
) => {
    const rolesNameIdMap = new Map<string, string>();
    for (const role of roles) {
        rolesNameIdMap.set(role.name, role.id);
    }

    const permissionsNameIdMap = new Map<string, string>();
    for (const permission of permissions) {
        permissionsNameIdMap.set(permission.name, permission.id);
    }

    const records = Object.entries(RBAC_SYSTEM_ROLES_PERMISSIONS).flatMap(
        ([roleName, permissions]) => {
            return Array.from(permissions.values()).map((permission) => {
                return {
                    permission_id: permissionsNameIdMap.get(permission),
                    role_id: rolesNameIdMap.get(roleName),
                };
            });
        },
    );

    return manager
        .createQueryBuilder()
        .insert()
        .into("role_permissions")
        .values(records)
        .execute();
};
