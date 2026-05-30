export const REDIS_TRUTHY_VALUE = "1";
export const REDIS_FALSY_VALUE = "0";

export const GLOBAL_REDIS_KEY_PREFIX = {
    AUTH_LOGOUT: "auth:logout:",
    CART: "cart:",
    CHECKOUT_LOCK: "checkout_lock:",
    IDEMPOTENCY: "idempotency:",
    ROLE_PERMISSIONS: "role_permissions:",
};

export const GENERIC_CONFLICT_MESSAGE = "Resource already exists";
export const GENERIC_INTERNAL_ERROR_MESSAGE = "Internal server error";
export const MYSQL_DUP_ENTRY_CODE = "ER_DUP_ENTRY";
