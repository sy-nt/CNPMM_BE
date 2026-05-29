/* eslint-disable no-restricted-imports */
import { ADDRESS_PERMISSIONS } from "@api/address/address.constants";
import { CATEGORY_PERMISSIONS } from "@api/category/category.constants";
import { IMAGE_PERMISSIONS } from "@api/image/image.constants";
import { ROLE_PERMISSIONS } from "@api/role/role.constants";
import {
    SHOP_ADDRESS_PERMISSIONS,
    SHOP_CATALOG_PERMISSIONS,
    SHOP_DISCOUNT_PERMISSIONS,
    SHOP_MODERATOR_PERMISSIONS,
    SHOP_PERMISSIONS,
    SHOP_STAFF_PERMISSIONS,
} from "@api/shop/shop.constants";
import { USER_PERMISSIONS } from "@api/user/user.constants";
import { mergePermissionMaps } from "@shared/utils/role";

export const RBAC_PERMISSIONS = mergePermissionMaps(
    ADDRESS_PERMISSIONS,
    ROLE_PERMISSIONS,
    SHOP_PERMISSIONS,
    SHOP_CATALOG_PERMISSIONS,
    SHOP_DISCOUNT_PERMISSIONS,
    SHOP_MODERATOR_PERMISSIONS,
    SHOP_STAFF_PERMISSIONS,
    SHOP_ADDRESS_PERMISSIONS,
    USER_PERMISSIONS,
    IMAGE_PERMISSIONS,
    CATEGORY_PERMISSIONS,
);

export const ROLE_PERMISSIONS_CACHE_TTL_SECONDS = 60 * 60;

export const RBAC_SYSTEM_ROLES = {
    ADMIN: "admin",
    GUEST: "guest",
    MODERATOR: "moderator",
    SHOP_MODERATOR: "shop_moderator",
    SHOP_OWNER: "shop_owner",
    SHOP_STAFF: "shop_staff",
    USER: "user",
} as const;

export type PermissionName =
    (typeof RBAC_PERMISSIONS)[keyof typeof RBAC_PERMISSIONS];
export type RBACSystemRoleName =
    (typeof RBAC_SYSTEM_ROLES)[keyof typeof RBAC_SYSTEM_ROLES];

export const RBAC_SYSTEM_ROLES_PERMISSIONS: Record<
    RBACSystemRoleName,
    Set<PermissionName>
> = {
    [RBAC_SYSTEM_ROLES.ADMIN]: new Set(Object.values(RBAC_PERMISSIONS)),
    [RBAC_SYSTEM_ROLES.GUEST]: new Set([
        CATEGORY_PERMISSIONS.CATEGORY_READ,
        IMAGE_PERMISSIONS.IMAGE_CREATE_PRESIGNED_URL,
        SHOP_PERMISSIONS.SHOP_READ,
    ]),
    [RBAC_SYSTEM_ROLES.MODERATOR]: new Set([
        SHOP_MODERATOR_PERMISSIONS.SHOP_MODERATOR_READ,
        SHOP_PERMISSIONS.SHOP_DELETE,
        SHOP_PERMISSIONS.SHOP_READ,
        SHOP_PERMISSIONS.SHOP_VERIFY,
        SHOP_STAFF_PERMISSIONS.SHOP_STAFF_READ,
        ...Object.values(ADDRESS_PERMISSIONS),
        ...Object.values(CATEGORY_PERMISSIONS),
        ...Object.values(IMAGE_PERMISSIONS),
    ]),
    [RBAC_SYSTEM_ROLES.SHOP_MODERATOR]: new Set([
        SHOP_MODERATOR_PERMISSIONS.SHOP_MODERATOR_READ,
        ...Object.values(CATEGORY_PERMISSIONS),
        ...Object.values(IMAGE_PERMISSIONS),
        ...Object.values(SHOP_ADDRESS_PERMISSIONS),
        ...Object.values(SHOP_CATALOG_PERMISSIONS),
        ...Object.values(SHOP_DISCOUNT_PERMISSIONS),
        ...Object.values(SHOP_STAFF_PERMISSIONS),
    ]),
    [RBAC_SYSTEM_ROLES.SHOP_OWNER]: new Set([
        SHOP_PERMISSIONS.SHOP_DELETE,
        SHOP_PERMISSIONS.SHOP_READ,
        SHOP_PERMISSIONS.SHOP_UPDATE,
        ...Object.values(ADDRESS_PERMISSIONS),
        ...Object.values(CATEGORY_PERMISSIONS),
        ...Object.values(IMAGE_PERMISSIONS),
        ...Object.values(SHOP_ADDRESS_PERMISSIONS),
        ...Object.values(SHOP_CATALOG_PERMISSIONS),
        ...Object.values(SHOP_DISCOUNT_PERMISSIONS),
        ...Object.values(SHOP_MODERATOR_PERMISSIONS),
        ...Object.values(SHOP_STAFF_PERMISSIONS),
    ]),
    [RBAC_SYSTEM_ROLES.SHOP_STAFF]: new Set([
        CATEGORY_PERMISSIONS.CATEGORY_READ,
        IMAGE_PERMISSIONS.IMAGE_CREATE_PRESIGNED_URL,
        SHOP_PERMISSIONS.SHOP_READ,
        SHOP_STAFF_PERMISSIONS.SHOP_STAFF_READ,
        ...Object.values(IMAGE_PERMISSIONS),
        ...Object.values(SHOP_CATALOG_PERMISSIONS),
        ...Object.values(SHOP_DISCOUNT_PERMISSIONS),
    ]),
    [RBAC_SYSTEM_ROLES.USER]: new Set([
        CATEGORY_PERMISSIONS.CATEGORY_READ,
        IMAGE_PERMISSIONS.IMAGE_CREATE_PRESIGNED_URL,
        SHOP_CATALOG_PERMISSIONS.SHOP_CATALOG_READ,
        SHOP_DISCOUNT_PERMISSIONS.SHOP_DISCOUNT_READ,
        SHOP_PERMISSIONS.SHOP_READ,
        SHOP_PERMISSIONS.SHOP_REGISTER,
        ...Object.values(ADDRESS_PERMISSIONS),
    ]),
} as const;
