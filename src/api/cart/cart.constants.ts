import { buildModulePermissionsMap } from "@shared/utils/role";

export enum CartError {
    CART_FULL = "Cart has reached the maximum number of distinct items",
    CART_ITEM_NOT_FOUND = "Cart item not found",
    QUANTITY_OUT_OF_BOUNDS = "Quantity is outside the allowed range",
    SHOP_NOT_AVAILABLE = "Shop is not currently accepting orders",
    SKU_NOT_AVAILABLE = "SKU is not available for purchase",
    SKU_NOT_FOUND = "SKU not found",
}

export const CART_MAX_ITEMS = 200;
export const CART_MAX_QUANTITY_PER_ITEM = 500;
export const CART_REDIS_TTL_SECONDS = 60 * 60 * 24 * 7;

export const RBAC_CART_ACTIONS = {
    DELETE: "delete",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_CART_MODULES = {
    CART: "cart",
} as const;

export const CART_PERMISSIONS = buildModulePermissionsMap(
    RBAC_CART_MODULES,
    RBAC_CART_ACTIONS,
);
