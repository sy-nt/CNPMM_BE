import { BadRequestError } from "@shared/lib/http/httpError";

import {
    DiscountError,
    DiscountIneligibleReason,
    DiscountRuleType,
} from "./discount.constants";
import { RuleEvalContext, RuleEvalResult } from "./discount.type";

export interface DiscountRuleStrategy<P = unknown> {
    evaluate(params: P, ctx: RuleEvalContext): RuleEvalResult;
    readonly type: DiscountRuleType;
}

export interface MinItemCountParams {
    count: number;
}

export interface MinSubtotalParams {
    amount: string;
}

export class DiscountRuleRegistry {
    private readonly strategies = new Map<
        DiscountRuleType,
        DiscountRuleStrategy
    >();

    get(type: DiscountRuleType): DiscountRuleStrategy {
        const strategy = this.strategies.get(type);
        if (!strategy) {
            throw new BadRequestError(DiscountError.INVALID_RULE_TYPE);
        }
        return strategy;
    }

    has(type: DiscountRuleType): boolean {
        return this.strategies.has(type);
    }

    register(strategy: DiscountRuleStrategy): void {
        this.strategies.set(strategy.type, strategy);
    }
}

export class MinItemCountRule
    implements DiscountRuleStrategy<MinItemCountParams>
{
    readonly type = DiscountRuleType.MIN_ITEM_COUNT;

    evaluate(params: MinItemCountParams, ctx: RuleEvalContext): RuleEvalResult {
        if (ctx.eligibleItemCount < params.count) {
            return {
                ok: false,
                reason: DiscountIneligibleReason.MIN_ITEM_COUNT_NOT_MET,
            };
        }
        return { ok: true };
    }
}

export class MinSubtotalRule
    implements DiscountRuleStrategy<MinSubtotalParams>
{
    readonly type = DiscountRuleType.MIN_SUBTOTAL;

    evaluate(params: MinSubtotalParams, ctx: RuleEvalContext): RuleEvalResult {
        if (Number(ctx.eligibleSubtotal) < Number(params.amount)) {
            return {
                ok: false,
                reason: DiscountIneligibleReason.MIN_SUBTOTAL_NOT_MET,
            };
        }
        return { ok: true };
    }
}

export const discountRuleRegistry = new DiscountRuleRegistry();
discountRuleRegistry.register(new MinItemCountRule());
discountRuleRegistry.register(new MinSubtotalRule());
