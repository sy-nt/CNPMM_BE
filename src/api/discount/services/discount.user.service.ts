import { DiscountEntity, DiscountScope } from "@domain/entities";
import { ConflictError } from "@shared/lib/http/httpError";
import { isUniqueViolationError } from "@shared/utils/db";
import { removeNil } from "@shared/utils/object";

import { DiscountError } from "../discount.constants";
import {
    ClaimDiscountRequestDto,
    DiscountClaimResponseDto,
    GetMyClaimsRequestDto,
    GetMyClaimsResponseDto,
    ListPlatformDiscountsRequestDto,
    ListPlatformDiscountsResponseDto,
    PlatformDiscountSummaryDto,
} from "../discount.dto";
import { DiscountBaseService } from "./discount.base.service";

export class DiscountUserService extends DiscountBaseService {
    async claimDiscount(
        dto: ClaimDiscountRequestDto,
    ): Promise<DiscountClaimResponseDto> {
        const discount = await this._getDiscountOrThrow(dto.id);
        await this._assertClaimable(discount, dto.callerUserId);
        try {
            const claim = await this.repositories.discountClaim.create({
                discountId: discount.id,
                userId: dto.callerUserId,
            });
            return this._toClaimResponse(claim, discount);
        } catch (error) {
            if (isUniqueViolationError(error)) {
                throw new ConflictError(DiscountError.CLAIM_ALREADY_EXISTS);
            }
            throw error;
        }
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

    async listPlatformDiscounts(
        dto: ListPlatformDiscountsRequestDto,
    ): Promise<ListPlatformDiscountsResponseDto> {
        const now = new Date();
        const result = await this.repositories.discount.paginate(
            {
                where: removeNil({
                    discountType: dto.discountType,
                    isActive: true,
                    scope: DiscountScope.GLOBAL,
                }),
            },
            {
                limit: dto.limit,
                orderBy: dto.orderBy,
                page: dto.page,
                sort: dto.sort,
            },
        );
        const activeItems = result.items.filter(
            (discount) =>
                (!discount.validFrom || discount.validFrom <= now) &&
                (!discount.validUntil || discount.validUntil >= now),
        );
        return {
            ...result,
            items: activeItems.map((discount) =>
                this._toPlatformDiscountSummary(discount),
            ),
        };
    }

    private _toPlatformDiscountSummary(
        discount: DiscountEntity,
    ): PlatformDiscountSummaryDto {
        return {
            ...this._toClaimDiscountSummary(discount),
            rules: discount.rules,
        };
    }
}

const discountUserService = new DiscountUserService();
export { discountUserService };
