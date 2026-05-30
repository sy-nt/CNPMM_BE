import { buildModulePermissionsMap } from "@shared/utils/role";

export const ADDRESS_PUBLIC_SELECT = {
    addressLine: true,
    city: true,
    country: true,
    district: true,
    id: true,
    isPrimary: true,
    latitude: true,
    longitude: true,
    name: true,
    state: true,
} as const;

export enum AddressError {
    ADDRESS_NOT_FOUND = "Address not found",
    NOT_SHOP_MEMBER = "Only users assigned to a shop can manage shop addresses",
}

export const RBAC_ADDRESS_ACTIONS = {
    CREATE: "create",
    DELETE: "delete",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_ADDRESS_MODULES = {
    ADDRESS: "address",
} as const;

export const ADDRESS_PERMISSIONS = buildModulePermissionsMap(
    RBAC_ADDRESS_MODULES,
    RBAC_ADDRESS_ACTIONS,
);

export type RBAC_ADDRESS_ACTIONS =
    (typeof RBAC_ADDRESS_ACTIONS)[keyof typeof RBAC_ADDRESS_ACTIONS];
export type RBAC_ADDRESS_MODULES =
    (typeof RBAC_ADDRESS_MODULES)[keyof typeof RBAC_ADDRESS_MODULES];
export type RBAC_ADDRESS_PERMISSIONS =
    `${RBAC_ADDRESS_MODULES}:${RBAC_ADDRESS_ACTIONS}`;
