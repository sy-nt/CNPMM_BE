import { buildModulePermissionsMap } from "@shared/utils/role";

export enum UserError {
    USER_ALREADY_EXISTS = "User already exists",
    USER_NOT_FOUND = "User not found",
}

export const RBAC_USER_ACTIONS = {
    BLOCK: "block",
    CREATE: "create",
    DEACTIVATE: "deactivate",
    DELETE: "delete",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_USER_MODULES = {
    USER: "user",
} as const;

export type RBAC_USER_ACTIONS =
    (typeof RBAC_USER_ACTIONS)[keyof typeof RBAC_USER_ACTIONS];
export type RBAC_USER_MODULES =
    (typeof RBAC_USER_MODULES)[keyof typeof RBAC_USER_MODULES];
export type RBAC_USER_PERMISSIONS = `${RBAC_USER_MODULES}:${RBAC_USER_ACTIONS}`;

export const USER_PERMISSIONS = buildModulePermissionsMap(
    RBAC_USER_MODULES,
    RBAC_USER_ACTIONS,
);
