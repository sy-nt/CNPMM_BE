import {
    DiscountClaimEntity,
    DiscountEntity,
    DiscountRule,
    DiscountScope,
    DiscountType,
    DiscountValueType,
} from "@domain/entities";
import { BaseService } from "@shared/lib/base/service";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import { In } from "typeorm";

import {
    DiscountError,
    DiscountIneligibleReason,
    DiscountRuleType,
} from "../discount.constants";
import {
    DiscountClaimResponseDto,
    DiscountClaimSummaryDto,
    DiscountResponseDto,
    GetDiscountsRequestDto,
    GetDiscountsResponseDto,
    UpdateDiscountRequestDto,
} from "../discount.dto";
import { discountRuleRegistry } from "../discount.rules";
import {
    DiscountEvaluationContext,
    DiscountEvaluationItem,
    DiscountEvaluationResult,
    RuleEvalContext,
} from "../discount.type";

export abstract class DiscountBaseService extends BaseService {
    protected async _assertCallerUserExists(userId: string): Promise<void> {
        const user = await this.repositories.user.findOne({
            select: { id: true },
            where: { id: userId },
        });
        if (!user) {
            throw new UnauthorizedError(DiscountError.CALLER_USER_NOT_FOUND);
        }
    }

    protected async _assertClaimable(
        discount: DiscountEntity,
        userId: string,
    ): Promise<void> {
        await this._assertCallerUserExists(userId);
        await this._assertNoExistingClaim(discount.id, userId);

        const now = new Date();
        if (
            !discount.isActive ||
            (discount.validFrom && discount.validFrom > now) ||
            (discount.validUntil && discount.validUntil < now)
        ) {
            throw new BadRequestError(DiscountError.CLAIM_NOT_CLAIMABLE);
        }
        if (discount.maxUses !== null && discount.maxUses !== undefined) {
            const activeClaims =
                await this.repositories.discountClaim.countActiveByDiscount(
                    discount.id,
                );
            if (discount.usedCount + activeClaims >= discount.maxUses) {
                throw new ConflictError(DiscountError.MAX_USES_REACHED);
            }
        }
        if (
            discount.maxUsesPerUser !== null &&
            discount.maxUsesPerUser !== undefined
        ) {
            const [userClaims, userRedemptions] = await Promise.all([
                this.repositories.discountClaim.countActiveByDiscountAndUser(
                    discount.id,
                    userId,
                ),
                this.repositories.discountRedemption.countByDiscountAndUser(
                    discount.id,
                    userId,
                ),
            ]);
            if (userClaims + userRedemptions >= discount.maxUsesPerUser) {
                throw new ConflictError(
                    DiscountError.MAX_USES_PER_USER_REACHED,
                );
            }
        }
    }

    protected _assertDiscountAccess(
        discount: DiscountEntity,
        callerShopId: string | undefined,
        isAdmin: boolean,
    ): void {
        if (isAdmin) return;
        if (
            discount.scope === DiscountScope.SHOP &&
            discount.shopId &&
            callerShopId === discount.shopId
        ) {
            return;
        }
        throw new ForbiddenError(DiscountError.DISCOUNT_FORBIDDEN);
    }

    protected _assertDiscountMutable(
        discount: DiscountEntity,
        dto: UpdateDiscountRequestDto,
    ): void {
        const now = new Date();
        const started = !!discount.validFrom && discount.validFrom <= now;
        const used = discount.usedCount > 0;
        if (!started && !used) return;
        const reservedKeys = new Set([
            "callerRoleId",
            "callerShopId",
            "id",
            "isActive",
        ]);
        const mutating = Object.entries(dto).some(
            ([key, value]) => value !== undefined && !reservedKeys.has(key),
        );
        if (mutating) {
            throw new BadRequestError(DiscountError.DISCOUNT_LOCKED);
        }
    }

    protected async _assertNoExistingClaim(
        discountId: string,
        userId: string,
    ): Promise<void> {
        const existingClaim = await this.repositories.discountClaim.findOne({
            select: { id: true },
            where: { discountId, userId },
        });
        if (existingClaim) {
            throw new ConflictError(DiscountError.CLAIM_ALREADY_EXISTS);
        }
    }

    protected _assertPercentageCap(
        discount: DiscountEntity,
        dto: UpdateDiscountRequestDto,
    ): void {
        if (dto.value === undefined && dto.valueType === undefined) return;
        const effectiveValueType = dto.valueType ?? discount.valueType;
        const effectiveValue = dto.value ?? discount.value;
        if (
            effectiveValueType === DiscountValueType.PERCENTAGE &&
            Number(effectiveValue) > 100
        ) {
            throw new BadRequestError(DiscountError.PERCENTAGE_CAP_EXCEEDED);
        }
    }

    protected _assertScopeTypeCombo(
        scope: DiscountScope,
        type: DiscountType,
    ): void {
        if (scope === DiscountScope.SHOP && type !== DiscountType.ITEMS) {
            throw new BadRequestError(DiscountError.INVALID_SCOPE_TYPE_COMBO);
        }
    }

    protected async _assertShopOwnsTargetSpus(
        shopId: string,
        spuIds: string[],
    ): Promise<void> {
        const rows = await this.repositories.spu.find({
            select: { id: true, shopId: true },
            where: { id: In(spuIds) },
        });
        if (rows.length !== spuIds.length) {
            throw new BadRequestError(DiscountError.INVALID_TARGET_SPUS);
        }
        const mismatch = rows.some((row) => row.shopId !== shopId);
        if (mismatch) {
            throw new BadRequestError(DiscountError.INVALID_TARGET_SPUS);
        }
    }

    protected async _assertTargetSpusUpdatable(
        discount: DiscountEntity,
        targetSpuIds: string[] | undefined,
    ): Promise<void> {
        if (targetSpuIds === undefined) return;
        if (discount.scope === DiscountScope.GLOBAL) {
            throw new BadRequestError(
                DiscountError.TARGET_SPUS_FORBIDDEN_FOR_GLOBAL_SCOPE,
            );
        }
        if (targetSpuIds.length > 0 && discount.shopId) {
            await this._assertShopOwnsTargetSpus(discount.shopId, targetSpuIds);
        }
    }

    protected _assertValidityWindowConsistent(
        discount: DiscountEntity,
        dto: UpdateDiscountRequestDto,
    ): void {
        if (dto.validFrom === undefined && dto.validUntil === undefined) return;
        const effectiveFrom =
            dto.validFrom === undefined ? discount.validFrom : dto.validFrom;
        const effectiveUntil =
            dto.validUntil === undefined ? discount.validUntil : dto.validUntil;
        if (
            effectiveFrom &&
            effectiveUntil &&
            effectiveUntil <= effectiveFrom
        ) {
            throw new BadRequestError(DiscountError.INVALID_VALIDITY_WINDOW);
        }
    }

    protected _assertWithinMaxUses(discount: DiscountEntity): void {
        if (
            discount.maxUses !== null &&
            discount.maxUses !== undefined &&
            discount.usedCount >= discount.maxUses
        ) {
            throw new ConflictError(DiscountError.MAX_USES_REACHED);
        }
    }

    protected async _assertWithinMaxUsesPerUser(
        discount: DiscountEntity,
        userId: string,
    ): Promise<void> {
        if (
            discount.maxUsesPerUser === null ||
            discount.maxUsesPerUser === undefined
        ) {
            return;
        }
        const used =
            await this.repositories.discountRedemption.countByDiscountAndUser(
                discount.id,
                userId,
            );
        if (used >= discount.maxUsesPerUser) {
            throw new ConflictError(DiscountError.MAX_USES_PER_USER_REACHED);
        }
    }

    protected _buildIneligibleResult(
        discountId: string,
        reason: DiscountIneligibleReason,
    ): DiscountEvaluationResult {
        return {
            appliedAmount: "0.00",
            discountId,
            eligibleSubtotal: "0.00",
            isEligible: false,
            reason,
        };
    }

    protected _buildListWhere(
        dto: GetDiscountsRequestDto,
        isAdmin: boolean,
    ): null | Record<string, unknown> {
        const where: Record<string, unknown> = removeNil({
            code: dto.code,
            discountType: dto.discountType,
            isActive: dto.isActive,
            scope: dto.scope,
        });
        if (isAdmin) return where;
        if (dto.callerShopId) {
            return {
                ...where,
                scope: DiscountScope.SHOP,
                shopId: dto.callerShopId,
            };
        }
        return null;
    }

    protected _buildRuleContext(
        discount: DiscountEntity,
        ctx: DiscountEvaluationContext,
        eligibleItems: DiscountEvaluationItem[],
    ): RuleEvalContext {
        if (discount.discountType === DiscountType.DELIVERY) {
            return {
                eligibleItemCount: ctx.items.reduce(
                    (acc, item) => acc + item.quantity,
                    0,
                ),
                eligibleItems: ctx.items,
                eligibleSubtotal: this._sumItems(ctx.items),
            };
        }
        return {
            eligibleItemCount: eligibleItems.reduce(
                (acc, item) => acc + item.quantity,
                0,
            ),
            eligibleItems,
            eligibleSubtotal: this._sumItems(eligibleItems),
        };
    }

    protected _buildUpdatePatch(
        patch: Omit<
            UpdateDiscountRequestDto,
            "callerRoleId" | "callerShopId" | "id" | "targetSpuIds"
        >,
    ): Record<string, unknown> {
        const updates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(patch)) {
            if (value === undefined) continue;
            updates[key] = value;
        }
        return updates;
    }

    protected _computeAmount(discount: DiscountEntity, base: string): string {
        const baseAmount = Number(base);
        if (baseAmount <= 0) return "0.00";
        let amount: number;
        if (discount.valueType === DiscountValueType.FIXED) {
            amount = Math.min(Number(discount.value), baseAmount);
        } else {
            amount = (baseAmount * Number(discount.value)) / 100;
            if (discount.maxDiscountAmount) {
                amount = Math.min(amount, Number(discount.maxDiscountAmount));
            }
            amount = Math.min(amount, baseAmount);
        }
        return amount.toFixed(2);
    }

    protected _emptyPage(dto: GetDiscountsRequestDto): GetDiscountsResponseDto {
        return {
            currentPage: dto.page,
            items: [],
            limit: dto.limit,
            total: 0,
            totalPage: 0,
        };
    }

    protected async _ensureCodeUnique(code: string): Promise<void> {
        const taken = await this.repositories.discount.isCodeTaken(code);
        if (taken) {
            throw new ConflictError(DiscountError.CODE_ALREADY_EXISTS);
        }
    }

    protected async _ensureShopExists(shopId: string): Promise<void> {
        const shop = await this.repositories.shop.findOne({
            select: { id: true },
            where: { id: shopId },
        });
        if (!shop) {
            throw new NotFoundError(DiscountError.SHOP_NOT_FOUND);
        }
    }

    protected async _filterEligibleItems(
        discount: DiscountEntity,
        ctx: DiscountEvaluationContext,
    ): Promise<DiscountEvaluationItem[]> {
        if (discount.discountType === DiscountType.DELIVERY) {
            return ctx.items;
        }
        let items = ctx.items;
        if (discount.scope === DiscountScope.SHOP && discount.shopId) {
            items = items.filter((item) => item.shopId === discount.shopId);
        }
        const targetSpuIds =
            await this.repositories.discountTargetSpu.findSpuIdsByDiscount(
                discount.id,
            );
        if (targetSpuIds.length > 0) {
            const allowed = new Set(targetSpuIds);
            items = items.filter((item) => allowed.has(item.spuId));
        }
        return items;
    }

    protected async _getDiscountOrThrow(id: string): Promise<DiscountEntity> {
        const discount = await this.repositories.discount.findOne({
            where: { id },
        });
        if (!discount) {
            throw new NotFoundError(DiscountError.DISCOUNT_NOT_FOUND);
        }
        return discount;
    }

    protected async _insertDiscount(
        values: Partial<DiscountEntity>,
    ): Promise<DiscountEntity> {
        return this.repositories.discount.create(values);
    }

    protected async _replaceTargetSpus(
        discountId: string,
        spuIds: string[] | undefined,
    ): Promise<void> {
        if (!spuIds) return;
        await this.repositories.discountTargetSpu.delete({ discountId });
        if (spuIds.length === 0) return;
        await this.repositories.discountTargetSpu.createMany(
            spuIds.map((spuId) => ({ discountId, spuId })),
        );
    }

    protected _resolveBaseAmount(
        discount: DiscountEntity,
        ruleCtx: RuleEvalContext,
        ctx: DiscountEvaluationContext,
    ): string {
        if (discount.discountType === DiscountType.DELIVERY) {
            return ctx.deliveryFee ?? "0.00";
        }
        return ruleCtx.eligibleSubtotal;
    }

    protected async _runPreChecks(
        discount: DiscountEntity,
        ctx: DiscountEvaluationContext,
    ): Promise<DiscountIneligibleReason | undefined> {
        if (!discount.isActive) return DiscountIneligibleReason.INACTIVE;
        if (discount.validFrom && discount.validFrom > ctx.evaluatedAt) {
            return DiscountIneligibleReason.NOT_STARTED;
        }
        if (discount.validUntil && discount.validUntil < ctx.evaluatedAt) {
            return DiscountIneligibleReason.EXPIRED;
        }
        if (discount.maxUses && discount.usedCount >= discount.maxUses) {
            return DiscountIneligibleReason.MAX_USES_REACHED;
        }
        if (discount.maxUsesPerUser) {
            const used =
                await this.repositories.discountRedemption.countByDiscountAndUser(
                    discount.id,
                    ctx.userId,
                );
            if (used >= discount.maxUsesPerUser) {
                return DiscountIneligibleReason.MAX_USES_PER_USER_REACHED;
            }
        }
        return undefined;
    }

    protected _runRules(
        rules: DiscountRule[],
        ruleCtx: RuleEvalContext,
    ): DiscountIneligibleReason | undefined {
        if (
            ruleCtx.eligibleItems.length === 0 &&
            ruleCtx.eligibleSubtotal === "0.00"
        ) {
            return DiscountIneligibleReason.NO_ELIGIBLE_ITEMS;
        }
        for (const rule of rules) {
            const strategy = discountRuleRegistry.get(
                rule.type as DiscountRuleType,
            );
            const result = strategy.evaluate(rule.params, ruleCtx);
            if (!result.ok) return result.reason;
        }
        return undefined;
    }

    protected _sumItems(items: DiscountEvaluationItem[]): string {
        const total = items.reduce(
            (acc, item) => acc + Number(item.unitPrice) * item.quantity,
            0,
        );
        return total.toFixed(2);
    }

    protected _toClaimDiscountSummary(
        discount: DiscountEntity,
    ): DiscountClaimSummaryDto {
        return {
            code: discount.code,
            description: discount.description,
            discountType: discount.discountType,
            id: discount.id,
            maxDiscountAmount: discount.maxDiscountAmount,
            name: discount.name,
            scope: discount.scope,
            shopId: discount.shopId,
            validFrom: discount.validFrom,
            validUntil: discount.validUntil,
            value: discount.value,
            valueType: discount.valueType,
        };
    }

    protected _toClaimResponse(
        claim: DiscountClaimEntity,
        discount: DiscountEntity,
    ): DiscountClaimResponseDto {
        return {
            claimedAt: claim.createdAt,
            discount: this._toClaimDiscountSummary(discount),
            id: claim.id,
            userId: claim.userId,
        };
    }

    protected _toResponse(
        entity: DiscountEntity,
        targetSpuIds: string[],
    ): DiscountResponseDto {
        return {
            code: entity.code,
            description: entity.description,
            discountType: entity.discountType,
            id: entity.id,
            isActive: entity.isActive,
            maxDiscountAmount: entity.maxDiscountAmount,
            maxUses: entity.maxUses,
            maxUsesPerUser: entity.maxUsesPerUser,
            name: entity.name,
            rules: entity.rules,
            scope: entity.scope,
            shopId: entity.shopId,
            targetSpuIds,
            usedCount: entity.usedCount,
            validFrom: entity.validFrom,
            validUntil: entity.validUntil,
            value: entity.value,
            valueType: entity.valueType,
        };
    }

    protected _validateRules(rules: DiscountRule[]): void {
        for (const rule of rules) {
            if (!discountRuleRegistry.has(rule.type as DiscountRuleType)) {
                throw new BadRequestError(DiscountError.INVALID_RULE_TYPE);
            }
        }
    }

    protected async _writeRedemption(
        discount: DiscountEntity,
        args: {
            discountId: string;
            orderId?: string;
            redeemedAmount: string;
            userId: string;
        },
    ): Promise<void> {
        this._assertWithinMaxUses(discount);
        await this._assertWithinMaxUsesPerUser(discount, args.userId);
        await this.repositories.discountRedemption.create({
            discountId: args.discountId,
            orderId: args.orderId,
            redeemedAmount: args.redeemedAmount,
            userId: args.userId,
        });
        await this.repositories.discount.bumpUsedCount(args.discountId);
    }
}
