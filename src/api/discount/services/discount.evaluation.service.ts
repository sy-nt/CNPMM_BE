import { DiscountEntity, DiscountScope, DiscountType } from "@domain/entities";
import { ForbiddenError, NotFoundError } from "@shared/lib/http/httpError";

import { DiscountError } from "../discount.constants";
import {
    DiscountEvaluationContext,
    DiscountEvaluationResult,
} from "../discount.type";
import { DiscountBaseService } from "./discount.base.service";

export class DiscountEvaluationService extends DiscountBaseService {
    async consumeClaim(args: {
        claimId: string;
        orderId?: string;
        redeemedAmount: string;
        userId: string;
    }): Promise<void> {
        const claim = await this.repositories.discountClaim.findOne({
            where: { id: args.claimId },
        });
        if (!claim) throw new NotFoundError(DiscountError.CLAIM_NOT_FOUND);
        if (claim.userId !== args.userId) {
            throw new ForbiddenError(DiscountError.CLAIM_FORBIDDEN);
        }
        const discount = await this.repositories.discount.findOneAndLock(
            claim.discountId,
        );
        if (!discount) {
            throw new NotFoundError(DiscountError.DISCOUNT_NOT_FOUND);
        }
        await this._writeRedemption(discount, {
            discountId: claim.discountId,
            orderId: args.orderId,
            redeemedAmount: args.redeemedAmount,
            userId: args.userId,
        });
        await this.repositories.discountClaim.delete({ id: claim.id });
    }

    async evaluate(
        discountOrId: DiscountEntity | string,
        ctx: DiscountEvaluationContext,
    ): Promise<DiscountEvaluationResult> {
        const discount =
            typeof discountOrId === "string"
                ? await this._getDiscountOrThrow(discountOrId)
                : discountOrId;
        const preCheckReason = await this._runPreChecks(discount, ctx);
        if (preCheckReason) {
            return this._buildIneligibleResult(discount.id, preCheckReason);
        }
        const eligibleItems = await this._filterEligibleItems(discount, ctx);
        const ruleCtx = this._buildRuleContext(discount, ctx, eligibleItems);
        const ruleReason = this._runRules(discount.rules, ruleCtx);
        if (ruleReason) {
            return this._buildIneligibleResult(discount.id, ruleReason);
        }
        const base = this._resolveBaseAmount(discount, ruleCtx, ctx);
        return {
            appliedAmount: this._computeAmount(discount, base),
            discountId: discount.id,
            eligibleSubtotal: ruleCtx.eligibleSubtotal,
            isEligible: true,
        };
    }

    async getBestAutoDiscount(args: {
        ctx: DiscountEvaluationContext;
        discountType: DiscountType;
        scopes: DiscountScope[];
        shopIds?: string[];
    }): Promise<DiscountEvaluationResult | null> {
        const candidates =
            await this.repositories.discount.findActiveCandidates({
                at: args.ctx.evaluatedAt,
                discountType: args.discountType,
                scopes: args.scopes,
                shopIds: args.shopIds,
            });
        const autoOnly = candidates.filter((c) => !c.code);
        let best: DiscountEvaluationResult | null = null;
        for (const candidate of autoOnly) {
            const result = await this.evaluate(candidate, args.ctx);
            if (!result.isEligible) continue;
            if (
                !best ||
                Number(result.appliedAmount) > Number(best.appliedAmount)
            ) {
                best = result;
            }
        }
        return best;
    }

    async recordRedemption(args: {
        discountId: string;
        orderId?: string;
        redeemedAmount: string;
        userId: string;
    }): Promise<void> {
        const discount = await this.repositories.discount.findOneAndLock(
            args.discountId,
        );
        if (!discount) {
            throw new NotFoundError(DiscountError.DISCOUNT_NOT_FOUND);
        }
        await this._writeRedemption(discount, args);
    }

    async releaseRedemption(orderId: string): Promise<void> {
        const rows =
            await this.repositories.discountRedemption.findByOrderId(orderId);
        if (rows.length === 0) return;
        for (const row of rows) {
            await this.repositories.discount.decrementUsedCount(row.discountId);
            await this.repositories.discountRedemption.delete({ id: row.id });
        }
    }

    async validateCode(
        code: string,
        ctx: DiscountEvaluationContext,
    ): Promise<DiscountEvaluationResult | null> {
        const discount =
            await this.repositories.discount.findActiveByCode(code);
        if (!discount) return null;
        return this.evaluate(discount, ctx);
    }
}

const discountEvaluationService = new DiscountEvaluationService();
export { discountEvaluationService };
