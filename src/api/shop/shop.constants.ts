import { ShopStatus } from "@domain/entities";
import { buildModulePermissionsMap } from "@shared/utils/role";

export enum ShopError {
    INVALID_ASSIGNED_WORKER = "Invalid assigned worker",
    INVALID_STATUS_TRANSITION = "Invalid status transition",
    SHOP_ALREADY_EXISTS = "Shop already exists",
    SHOP_MAX_WORKERS_REACHED = "Shop max workers reached",
    SHOP_NOT_FOUND = "Shop not found",
    SHOP_OWNER_ROLE_NOT_FOUND = "Shop owner role not found",
}

export const SHOP_STATUS_TRANSITIONS: Record<ShopStatus, ShopStatus[]> = {
    [ShopStatus.ACTIVE]: [ShopStatus.SUSPENDED],
    [ShopStatus.PENDING]: [ShopStatus.ACTIVE],
    [ShopStatus.SUSPENDED]: [ShopStatus.ACTIVE],
};

export const SHOP_ORDER_BY_FIELDS = ["createdAt", "name", "status"] as const;
export const SHOP_ORDER_BY_FIELDS_DEFAULT = "createdAt";

export const SHOP_MAX_WORKERS = 20;

export const SHOP_PERMISSIONS = buildModulePermissionsMap(
    { SHOP: "shop" } as const,
    {
        DELETE: "delete",
        READ: "read",
        REGISTER: "register",
        UPDATE: "update",
        VERIFY: "verify",
    } as const,
);

export const SHOP_CATALOG_PERMISSIONS = buildModulePermissionsMap(
    { SHOP_CATALOG: "shop_catalog" } as const,
    {
        CREATE: "create",
        DELETE: "delete",
        READ: "read",
        UPDATE: "update",
    } as const,
);

export const SHOP_DISCOUNT_PERMISSIONS = buildModulePermissionsMap(
    { SHOP_DISCOUNT: "shop_discount" } as const,
    {
        CREATE: "create",
        DELETE: "delete",
        READ: "read",
        UPDATE: "update",
    } as const,
);

export const SHOP_MODERATOR_PERMISSIONS = buildModulePermissionsMap(
    { SHOP_MODERATOR: "shop_moderator" } as const,
    {
        ASSIGN: "assign",
        READ: "read",
        UNASSIGN: "unassign",
    } as const,
);

export const SHOP_STAFF_PERMISSIONS = buildModulePermissionsMap(
    { SHOP_STAFF: "shop_staff" } as const,
    {
        ASSIGN: "assign",
        READ: "read",
        UNASSIGN: "unassign",
    } as const,
);

export const SHOP_ADDRESS_PERMISSIONS = buildModulePermissionsMap(
    { SHOP_ADDRESS: "shop_address" } as const,
    {
        CREATE: "create",
        DELETE: "delete",
        READ: "read",
        UPDATE: "update",
    } as const,
);
