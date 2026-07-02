import { OrderStatus } from "@domain/entities";
import { buildModulePermissionsMap } from "@shared/utils/role";

export const CHECKOUT_REDIS_LOCK_TTL_SECONDS = 120;

export const CHECKOUT_LOCK_RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
`;

export const ORDER_CUSTOMER_CANCEL_WINDOW_MINUTES = 30;

export const ORDER_CANCELLABLE_BY_CUSTOMER: Set<OrderStatus> = new Set([
    OrderStatus.CONFIRMED,
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
]);

export const ORDER_CANCELLABLE_BY_SHOP: Set<OrderStatus> = new Set([
    OrderStatus.CONFIRMED,
    OrderStatus.PENDING,
]);

export const ORDER_ORDER_BY_FIELDS = [
    "createdAt",
    "status",
    "totalAmount",
] as const;
export const ORDER_ORDER_BY_FIELDS_DEFAULT = "createdAt";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
};

export enum OrderCancelledByRole {
    CUSTOMER = "customer",
    SHOP = "shop",
}

export enum OrderError {
    CART_EMPTY = "Cart is empty",
    CART_ITEM_NOT_FOUND = "One or more selected items are not in the cart",
    CART_ITEM_QUANTITY_EXCEEDED = "Requested quantity exceeds cart quantity for one or more items",
    CHECKOUT_LOCKED = "Another checkout is already in progress",
    DESTINATION_ADDRESS_NOT_FOUND = "Destination address not found",
    DESTINATION_ADDRESS_NOT_OWNED = "Destination address does not belong to the caller",
    INSUFFICIENT_STOCK = "Insufficient stock for one or more items",
    INVALID_STATUS_TRANSITION = "Invalid status transition",
    NO_WAREHOUSE_AVAILABLE = "No warehouse can fulfill the order",
    ORDER_CANCEL_WINDOW_EXPIRED = "Order can only be cancelled within 30 minutes of placement",
    ORDER_FORBIDDEN = "You are not allowed to access this order",
    ORDER_NOT_CANCELLABLE = "Order cannot be cancelled in current status",
    ORDER_NOT_FOUND = "Order not found",
    PRICE_CHANGED = "Pricing changed since preview, please re-preview",
    RESTOCK_FAILED = "Failed to restock inventory for cancelled order",
    SHOP_INACTIVE = "One or more shops in the cart are not active",
    SHOP_NOT_FOUND = "Shop not found",
    SKU_NOT_PURCHASABLE = "One or more items are no longer purchasable",
}

export const RBAC_ORDER_ACTIONS = {
    CANCEL: "cancel",
    PLACE: "place",
    PREVIEW: "preview",
    READ: "read",
    UPDATE_STATUS: "update_status",
} as const;

export const RBAC_ORDER_MODULES = { ORDER: "order" } as const;

export const ORDER_PERMISSIONS = buildModulePermissionsMap(
    RBAC_ORDER_MODULES,
    RBAC_ORDER_ACTIONS,
);
