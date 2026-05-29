import { buildModulePermissionsMap } from "@shared/utils/role";

export enum WarehouseError {
    ADDRESS_ALREADY_USED = "Address is already linked to another warehouse",
    ADDRESS_ALREADY_USED_BY_DELETED = "Address is held by a soft-deleted warehouse; restore it or pick a different address",
    ADDRESS_NOT_FOUND = "Address not found",
    ADDRESS_NOT_OWNED = "Address does not belong to the caller's shop",
    SHOP_REQUIRED = "Caller is not assigned to a shop",
    WAREHOUSE_CODE_ALREADY_EXISTS = "Warehouse code already exists in this shop",
    WAREHOUSE_CODE_ALREADY_EXISTS_DELETED = "Warehouse code is held by a soft-deleted warehouse; restore it or pick a different code",
    WAREHOUSE_NOT_FOUND = "Warehouse not found",
}

export const WAREHOUSE_ORDER_BY_FIELDS = ["code", "createdAt", "name"] as const;
export const WAREHOUSE_ORDER_BY_FIELDS_DEFAULT = "createdAt";

export const RBAC_WAREHOUSE_ACTIONS = {
    CREATE: "create",
    DELETE: "delete",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_WAREHOUSE_MODULES = {
    WAREHOUSE: "warehouse",
} as const;

export const WAREHOUSE_PERMISSIONS = buildModulePermissionsMap(
    RBAC_WAREHOUSE_MODULES,
    RBAC_WAREHOUSE_ACTIONS,
);
