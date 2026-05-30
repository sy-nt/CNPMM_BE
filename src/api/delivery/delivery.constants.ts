import { DeliveryStatus } from "@domain/entities";
import { buildModulePermissionsMap } from "@shared/utils/role";

export enum DeliveryError {
    DELIVERY_FORBIDDEN = "You are not allowed to access this delivery",
    DELIVERY_METHOD_CODE_ALREADY_EXISTS = "Delivery method code already exists",
    DELIVERY_METHOD_INACTIVE = "Delivery method is inactive",
    DELIVERY_METHOD_NOT_FOUND = "Delivery method not found",
    DELIVERY_NOT_FOUND = "Delivery not found",
    DELIVERY_RATE_ALREADY_EXISTS = "A rate already exists for this method and zone",
    DELIVERY_RATE_NOT_CONFIGURED = "No rate configured for the matched zone",
    DELIVERY_RATE_NOT_FOUND = "Delivery rate not found",
    DELIVERY_STATUS_TRANSITION_INVALID = "Invalid delivery status transition",
    DELIVERY_STRATEGY_NOT_FOUND = "Delivery strategy not registered",
    DELIVERY_ZONE_CODE_ALREADY_EXISTS = "Delivery zone code already exists",
    DELIVERY_ZONE_NOT_FOUND = "Delivery zone not found",
    DESTINATION_ADDRESS_NOT_FOUND = "Destination address not found",
    WAREHOUSE_NOT_FOUND = "Warehouse not found",
}

export const DELIVERY_DEFAULT_PROVIDER_CODE = "zone-table";

export const DELIVERY_ORDER_BY_FIELDS = ["createdAt", "fee", "status"] as const;
export const DELIVERY_ORDER_BY_FIELDS_DEFAULT = "createdAt";

export enum DeliveryZoneCode {
    CROSS_COUNTRY = "CROSS_COUNTRY",
    SAME_CITY = "SAME_CITY",
    SAME_COUNTRY = "SAME_COUNTRY",
    SAME_DISTRICT = "SAME_DISTRICT",
    SAME_STATE = "SAME_STATE",
}

export const DELIVERY_STATUS_TRANSITIONS: Record<
    DeliveryStatus,
    DeliveryStatus[]
> = {
    [DeliveryStatus.CANCELLED]: [],
    [DeliveryStatus.DELIVERED]: [],
    [DeliveryStatus.IN_TRANSIT]: [
        DeliveryStatus.CANCELLED,
        DeliveryStatus.DELIVERED,
    ],
    [DeliveryStatus.PENDING]: [
        DeliveryStatus.CANCELLED,
        DeliveryStatus.IN_TRANSIT,
    ],
};

export const RBAC_DELIVERY_ACTIONS = {
    CREATE: "create",
    DELETE: "delete",
    QUOTE: "quote",
    READ: "read",
    UPDATE: "update",
    UPDATE_STATUS: "update_status",
} as const;

export const RBAC_DELIVERY_MODULES = {
    DELIVERY: "delivery",
    DELIVERY_METHOD: "delivery_method",
    DELIVERY_RATE: "delivery_rate",
    DELIVERY_ZONE: "delivery_zone",
} as const;

export const DELIVERY_PERMISSIONS = buildModulePermissionsMap(
    RBAC_DELIVERY_MODULES,
    RBAC_DELIVERY_ACTIONS,
);
