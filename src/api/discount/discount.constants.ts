import { buildModulePermissionsMap } from "@shared/utils/role";

export enum DiscountError {
    CALLER_USER_NOT_FOUND = "Your account no longer exists; please sign in again",
    CLAIM_ALREADY_EXISTS = "You have already claimed this discount",
    CLAIM_FORBIDDEN = "You are not allowed to use this claim",
    CLAIM_NOT_CLAIMABLE = "Discount cannot be claimed (inactive, expired, or maxed out)",
    CLAIM_NOT_FOUND = "Claim not found",
    CODE_ALREADY_EXISTS = "Discount code already exists",
    DISCOUNT_FORBIDDEN = "You are not allowed to access this discount",
    DISCOUNT_LOCKED = "Discount has already started or been redeemed; only isActive may be changed",
    DISCOUNT_NOT_FOUND = "Discount not found",
    INVALID_RULE_TYPE = "Unknown discount rule type",
    INVALID_SCOPE_TYPE_COMBO = "Shop-scope discounts must be of type ITEMS",
    INVALID_TARGET_SPUS = "One or more target SPUs do not belong to the shop",
    INVALID_VALIDITY_WINDOW = "validUntil must be after validFrom",
    MAX_USES_PER_USER_REACHED = "You have reached the maximum number of uses for this discount",
    MAX_USES_REACHED = "Discount has reached its maximum number of uses",
    PERCENTAGE_CAP_EXCEEDED = "value must be <= 100 when valueType is percentage",
    SHOP_NOT_FOUND = "Shop not found",
    SHOP_REQUIRED_FOR_SHOP_SCOPE = "shopId is required when scope is SHOP",
    TARGET_SPUS_FORBIDDEN_FOR_GLOBAL_SCOPE = "targetSpuIds are not allowed when scope is GLOBAL",
    UPDATE_FIELD_FORBIDDEN = "Cannot change scope, discountType, or shopId of an existing discount",
}

export enum DiscountIneligibleReason {
    EXPIRED = "expired",
    INACTIVE = "inactive",
    MAX_USES_PER_USER_REACHED = "max_uses_per_user_reached",
    MAX_USES_REACHED = "max_uses_reached",
    MIN_ITEM_COUNT_NOT_MET = "min_item_count_not_met",
    MIN_SUBTOTAL_NOT_MET = "min_subtotal_not_met",
    NO_ELIGIBLE_ITEMS = "no_eligible_items",
    NOT_STARTED = "not_started",
    WRONG_SCOPE = "wrong_scope",
}

export enum DiscountRuleType {
    MIN_ITEM_COUNT = "min_item_count",
    MIN_SUBTOTAL = "min_subtotal",
}

export const DISCOUNT_ORDER_BY_FIELDS = [
    "createdAt",
    "name",
    "usedCount",
    "validUntil",
] as const;
export const DISCOUNT_ORDER_BY_FIELDS_DEFAULT = "createdAt";

export const RBAC_DISCOUNT_ACTIONS = {
    CLAIM: "claim",
    CREATE: "create",
    DELETE: "delete",
    READ: "read",
    UPDATE: "update",
} as const;

export const RBAC_DISCOUNT_MODULES = { DISCOUNT: "discount" } as const;

export const DISCOUNT_PERMISSIONS = buildModulePermissionsMap(
    RBAC_DISCOUNT_MODULES,
    RBAC_DISCOUNT_ACTIONS,
);
