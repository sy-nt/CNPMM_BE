import {
    DiscountIneligibleReason,
    DiscountRuleType,
} from "./discount.constants";

export interface DiscountEvaluationContext {
    deliveryFee?: string;
    evaluatedAt: Date;
    items: DiscountEvaluationItem[];
    userId: string;
}

export interface DiscountEvaluationItem {
    quantity: number;
    shopId: string;
    skuId: string;
    spuId: string;
    unitPrice: string;
}

export interface DiscountEvaluationResult {
    appliedAmount: string;
    discountId: string;
    eligibleSubtotal: string;
    isEligible: boolean;
    reason?: DiscountIneligibleReason;
}

export interface DiscountRuleInput {
    params: unknown;
    type: DiscountRuleType;
}

export interface RuleEvalContext {
    eligibleItemCount: number;
    eligibleItems: DiscountEvaluationItem[];
    eligibleSubtotal: string;
}

export interface RuleEvalResult {
    ok: boolean;
    reason?: DiscountIneligibleReason;
}
