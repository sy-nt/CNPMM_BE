import { buildModulePermissionsMap } from "@shared/utils/role";

export enum InventoryError {
    INVENTORY_CONCURRENT_UPDATE = "Inventory was modified by another request, please retry",
    INVENTORY_NOT_FOUND = "Inventory row not found for this SKU and warehouse",
    QUANTITY_BELOW_ZERO = "Resulting quantity would be negative",
    SHOP_REQUIRED = "Caller is not assigned to a shop",
    SKU_NOT_FOUND = "SKU not found",
    SKU_NOT_OWNED = "SKU does not belong to the caller's shop",
    WAREHOUSE_NOT_FOUND = "Warehouse not found",
    WAREHOUSE_NOT_OWNED = "Warehouse does not belong to the caller's shop",
}

export const INVENTORY_ORDER_BY_FIELDS = [
    "createdAt",
    "quantity",
    "updatedAt",
] as const;
export const INVENTORY_ORDER_BY_FIELDS_DEFAULT = "updatedAt";

export const RBAC_INVENTORY_ACTIONS = {
    ADJUST: "adjust",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_INVENTORY_MODULES = {
    INVENTORY: "inventory",
} as const;

export const INVENTORY_PERMISSIONS = buildModulePermissionsMap(
    RBAC_INVENTORY_MODULES,
    RBAC_INVENTORY_ACTIONS,
);
