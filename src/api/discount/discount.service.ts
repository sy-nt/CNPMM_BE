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
} from "@shared/lib/http/httpError";
import rbacService from "@shared/lib/rbac/rbac.service";
import { removeNil } from "@shared/utils/object";
import { In } from "typeorm";

import {
    DiscountError,
    DiscountIneligibleReason,
    DiscountRuleType,
} from "./discount.constants";
import {
    ClaimDiscountRequestDto,
    CreateGlobalDiscountRequestDto,
    CreateShopDiscountRequestDto,
    DeleteDiscountRequestDto,
    DiscountClaimResponseDto,
    DiscountClaimSummaryDto,
    DiscountResponseDto,
    GetDiscountRequestDto,
    GetDiscountsRequestDto,
    GetDiscountsResponseDto,
    GetMyClaimsRequestDto,
    GetMyClaimsResponseDto,
    UpdateDiscountRequestDto,
} from "./discount.dto";
import { discountRuleRegistry } from "./discount.rules";
import {
    DiscountEvaluationContext,
    DiscountEvaluationItem,
    DiscountEvaluationResult,
    RuleEvalContext,
} from "./discount.type";

export class DiscountService extends BaseService {
    async claimDiscount(
        dto: ClaimDiscountRequestDto,
    ): Promise<DiscountClaimResponseDto> {
        const discount = await this._getDiscountOrThrow(dto.id);
        await this._assertClaimable(discount, dto.callerUserId);
        const claim = await this.repositories.discountClaim.create({
            discountId: discount.id,
            userId: dto.callerUserId,
        });
        return this._toClaimResponse(claim, discount);
    }

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

    async createGlobalDiscount(
        dto: CreateGlobalDiscountRequestDto,
    ): Promise<DiscountResponseDto> {
        this._assertScopeTypeCombo(dto.scope, dto.discountType);
        if (dto.code) await this._ensureCodeUnique(dto.code);
        this._validateRules(dto.rules);
        if (dto.scope === DiscountScope.SHOP && dto.shopId) {
            await this._ensureShopExists(dto.shopId);
            if (dto.targetSpuIds?.length) {
                await this._assertShopOwnsTargetSpus(
                    dto.shopId,
                    dto.targetSpuIds,
                );
            }
        }
        const created = await this._insertDiscount({
            code: dto.code,
            description: dto.description,
            discountType: dto.discountType,
            isActive: dto.isActive ?? true,
            maxDiscountAmount: dto.maxDiscountAmount,
            maxUses: dto.maxUses,
            maxUsesPerUser: dto.maxUsesPerUser,
            name: dto.name,
            rules: dto.rules,
            scope: dto.scope,
            shopId: dto.shopId,
            validFrom: dto.validFrom,
            validUntil: dto.validUntil,
            value: dto.value,
            valueType: dto.valueType,
        });
        await this._replaceTargetSpus(created.id, dto.targetSpuIds);
        return this._toResponse(created, dto.targetSpuIds ?? []);
    }

    async createShopDiscount(
        dto: CreateShopDiscountRequestDto,
    ): Promise<DiscountResponseDto> {
        if (dto.code) await this._ensureCodeUnique(dto.code);
        this._validateRules(dto.rules);
        await this._ensureShopExists(dto.shopId);
        if (dto.targetSpuIds?.length) {
            await this._assertShopOwnsTargetSpus(dto.shopId, dto.targetSpuIds);
        }
        const created = await this._insertDiscount({
            code: dto.code,
            description: dto.description,
            discountType: DiscountType.ITEMS,
            isActive: dto.isActive ?? true,
            maxDiscountAmount: dto.maxDiscountAmount,
            maxUses: dto.maxUses,
            maxUsesPerUser: dto.maxUsesPerUser,
            name: dto.name,
            rules: dto.rules,
            scope: DiscountScope.SHOP,
            shopId: dto.shopId,
            validFrom: dto.validFrom,
            validUntil: dto.validUntil,
            value: dto.value,
            valueType: dto.valueType,
        });
        await this._replaceTargetSpus(created.id, dto.targetSpuIds);
        return this._toResponse(created, dto.targetSpuIds ?? []);
    }

    async deleteDiscount(dto: DeleteDiscountRequestDto): Promise<void> {
        const discount = await this._getDiscountOrThrow(dto.id);
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        this._assertDiscountAccess(discount, dto.callerShopId, isAdmin);
        await this.repositories.discount.softDelete({ id: dto.id });
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

    async getDiscount(
        dto: GetDiscountRequestDto,
    ): Promise<DiscountResponseDto> {
        const discount = await this._getDiscountOrThrow(dto.id);
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        this._assertDiscountAccess(discount, dto.callerShopId, isAdmin);
        const targetSpuIds =
            await this.repositories.discountTargetSpu.findSpuIdsByDiscount(
                discount.id,
            );
        return this._toResponse(discount, targetSpuIds);
    }

    async getDiscounts(
        dto: GetDiscountsRequestDto,
    ): Promise<GetDiscountsResponseDto> {
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        const where = this._buildListWhere(dto, isAdmin);
        if (where === null) {
            return this._emptyPage(dto);
        }
        const result = await this.repositories.discount.paginate(
            { where },
            {
                limit: dto.limit,
                orderBy: dto.orderBy,
                page: dto.page,
                sort: dto.sort,
            },
        );
        const targetMap =
            await this.repositories.discountTargetSpu.findSpuIdsByDiscountIds(
                result.items.map((item) => item.id),
            );
        return {
            ...result,
            items: result.items.map((item) =>
                this._toResponse(item, targetMap.get(item.id) ?? []),
            ),
        };
    }

    async getMyClaims(
        dto: GetMyClaimsRequestDto,
    ): Promise<GetMyClaimsResponseDto> {
        const result = await this.repositories.discountClaim.findActiveByUser(
            dto.callerUserId,
            {
                limit: dto.limit,
                orderBy: dto.orderBy,
                page: dto.page,
                sort: dto.sort,
            },
        );
        return {
            ...result,
            items: result.items.map((claim) =>
                this._toClaimResponse(claim, claim.discount),
            ),
        };
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

    async updateDiscount(
        dto: UpdateDiscountRequestDto,
    ): Promise<DiscountResponseDto> {
        const discount = await this._getDiscountOrThrow(dto.id);
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        this._assertDiscountAccess(discount, dto.callerShopId, isAdmin);
        this._assertDiscountMutable(discount, dto);
        if (dto.code && dto.code !== discount.code) {
            await this._ensureCodeUnique(dto.code);
        }
        if (dto.rules) this._validateRules(dto.rules);
        this._assertPercentageCap(discount, dto);
        this._assertValidityWindowConsistent(discount, dto);
        await this._assertTargetSpusUpdatable(discount, dto.targetSpuIds);
        const { callerRoleId, callerShopId, id, targetSpuIds, ...patch } = dto;
        void callerRoleId;
        void callerShopId;
        const updates = this._buildUpdatePatch(patch);
        if (Object.keys(updates).length > 0) {
            await this.repositories.discount.update({ id }, updates);
        }
        if (targetSpuIds) await this._replaceTargetSpus(id, targetSpuIds);
        return this.getDiscount({
            callerRoleId: dto.callerRoleId,
            callerShopId: dto.callerShopId,
            id,
        });
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

    private async _assertClaimable(
        discount: DiscountEntity,
        userId: string,
    ): Promise<void> {
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

    private _assertDiscountAccess(
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

    private _assertDiscountMutable(
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

    private _assertPercentageCap(
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

    private _assertScopeTypeCombo(
        scope: DiscountScope,
        type: DiscountType,
    ): void {
        if (scope === DiscountScope.SHOP && type !== DiscountType.ITEMS) {
            throw new BadRequestError(DiscountError.INVALID_SCOPE_TYPE_COMBO);
        }
    }

    private async _assertShopOwnsTargetSpus(
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

    private async _assertTargetSpusUpdatable(
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

    private _assertValidityWindowConsistent(
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

    private _assertWithinMaxUses(discount: DiscountEntity): void {
        if (
            discount.maxUses !== null &&
            discount.maxUses !== undefined &&
            discount.usedCount >= discount.maxUses
        ) {
            throw new ConflictError(DiscountError.MAX_USES_REACHED);
        }
    }

    private async _assertWithinMaxUsesPerUser(
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

    private _buildIneligibleResult(
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

    private _buildListWhere(
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

    private _buildRuleContext(
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

    private _buildUpdatePatch(
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

    private _computeAmount(discount: DiscountEntity, base: string): string {
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

    private _emptyPage(dto: GetDiscountsRequestDto): GetDiscountsResponseDto {
        return {
            currentPage: dto.page,
            items: [],
            limit: dto.limit,
            total: 0,
            totalPage: 0,
        };
    }

    private async _ensureCodeUnique(code: string): Promise<void> {
        const taken = await this.repositories.discount.isCodeTaken(code);
        if (taken) {
            throw new ConflictError(DiscountError.CODE_ALREADY_EXISTS);
        }
    }

    private async _ensureShopExists(shopId: string): Promise<void> {
        const shop = await this.repositories.shop.findOne({
            select: { id: true },
            where: { id: shopId },
        });
        if (!shop) {
            throw new NotFoundError(DiscountError.SHOP_NOT_FOUND);
        }
    }

    private async _filterEligibleItems(
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

    private async _getDiscountOrThrow(id: string): Promise<DiscountEntity> {
        const discount = await this.repositories.discount.findOne({
            where: { id },
        });
        if (!discount) {
            throw new NotFoundError(DiscountError.DISCOUNT_NOT_FOUND);
        }
        return discount;
    }

    private async _insertDiscount(
        values: Partial<DiscountEntity>,
    ): Promise<DiscountEntity> {
        return this.repositories.discount.create(values);
    }

    private async _replaceTargetSpus(
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

    private _resolveBaseAmount(
        discount: DiscountEntity,
        ruleCtx: RuleEvalContext,
        ctx: DiscountEvaluationContext,
    ): string {
        if (discount.discountType === DiscountType.DELIVERY) {
            return ctx.deliveryFee ?? "0.00";
        }
        return ruleCtx.eligibleSubtotal;
    }

    private async _runPreChecks(
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

    private _runRules(
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

    private _sumItems(items: DiscountEvaluationItem[]): string {
        const total = items.reduce(
            (acc, item) => acc + Number(item.unitPrice) * item.quantity,
            0,
        );
        return total.toFixed(2);
    }

    private _toClaimDiscountSummary(
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

    private _toClaimResponse(
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

    private _toResponse(
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

    private _validateRules(rules: DiscountRule[]): void {
        for (const rule of rules) {
            if (!discountRuleRegistry.has(rule.type as DiscountRuleType)) {
                throw new BadRequestError(DiscountError.INVALID_RULE_TYPE);
            }
        }
    }

    private async _writeRedemption(
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

const discountService = new DiscountService();
export default discountService;
