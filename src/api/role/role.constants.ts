import { buildModulePermissionsMap } from "@shared/utils/role";

export enum RoleError {
    INVALID_PERMISSION_IDS = "One or more permission ids are invalid",
    ROLE_ALREADY_EXISTS = "Role name already exists",
    ROLE_NOT_FOUND = "Role not found",
    SYSTEM_ROLE_NOT_DELETABLE = "System role cannot be deleted",
}

export const ROLE_ORDER_BY_FIELDS = ["name", "createdAt"];
export const ROLE_ORDER_BY_FIELDS_DEFAULT = "createdAt";

export const RBAC_ROLE_ACTIONS = {
    CREATE: "create",
    DELETE: "delete",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_ROLE_MODULES = {
    PERMISSION: "permission",
    ROLE: "role",
} as const;

export type RBAC_ROLE_ACTIONS =
    (typeof RBAC_ROLE_ACTIONS)[keyof typeof RBAC_ROLE_ACTIONS];
export type RBAC_ROLE_MODULES =
    (typeof RBAC_ROLE_MODULES)[keyof typeof RBAC_ROLE_MODULES];
export type RBAC_ROLE_PERMISSIONS = `${RBAC_ROLE_MODULES}:${RBAC_ROLE_ACTIONS}`;

export const ROLE_PERMISSIONS = buildModulePermissionsMap(
    RBAC_ROLE_MODULES,
    RBAC_ROLE_ACTIONS,
);
