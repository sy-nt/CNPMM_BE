import { buildModulePermissionsMap } from "@shared/utils/role";

export enum CategoryError {
    CATEGORY_FORBIDDEN = "You are not allowed to mutate this category",
    CATEGORY_MAX_DEPTH_EXCEEDED = "Category max depth exceeded",
    CATEGORY_NOT_FOUND = "Category not found",
    CATEGORY_PARENT_NOT_FOUND = "Parent category not found",
}

export const CATEGORY_MAX_DEPTH = 4;

export const CATEGORY_ORDER_BY_FIELDS = [
    "createdAt",
    "displayOrder",
    "name",
] as const;
export const CATEGORY_ORDER_BY_FIELDS_DEFAULT = "displayOrder";

export const RBAC_CATEGORY_ACTIONS = {
    CREATE: "create",
    DELETE: "delete",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_CATEGORY_MODULES = {
    CATEGORY: "category",
} as const;

export const CATEGORY_PERMISSIONS = buildModulePermissionsMap(
    RBAC_CATEGORY_MODULES,
    RBAC_CATEGORY_ACTIONS,
);
