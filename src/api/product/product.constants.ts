import { buildModulePermissionsMap } from "@shared/utils/role";

export enum ProductError {
    ATTRIBUTE_NOT_FOUND = "Attribute not found",
    ATTRIBUTE_VALUE_NOT_FOUND = "Attribute value not found",
    CATEGORY_NOT_FOUND = "Category not found",
    PRODUCT_CONCURRENT_UPDATE = "Product was modified by another request, please refresh and retry",
    PRODUCT_NOT_FOUND = "Product not found",
    PRODUCT_NOT_OWNED = "Product does not belong to the caller's shop",
    SHOP_REQUIRED = "Caller is not assigned to a shop",
    SKU_CODE_ALREADY_EXISTS = "SKU code already exists",
    SKU_NOT_FOUND = "SKU not found",
    SKU_SELECTION_INVALID = "SKU selection must reference one value per attribute",
    WAREHOUSE_NOT_FOUND = "Warehouse not found",
}

export const PRODUCT_ORDER_BY_FIELDS = ["createdAt", "name", "price"] as const;
export const PRODUCT_ORDER_BY_FIELDS_DEFAULT = "createdAt";

export const RBAC_PRODUCT_ACTIONS = {
    CREATE: "create",
    DELETE: "delete",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_PRODUCT_MODULES = {
    PRODUCT: "product",
} as const;

export const PRODUCT_PERMISSIONS = buildModulePermissionsMap(
    RBAC_PRODUCT_MODULES,
    RBAC_PRODUCT_ACTIONS,
);
