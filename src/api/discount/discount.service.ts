import { DiscountEntity, DiscountScope, DiscountType } from "@domain/entities";

import {
    ClaimDiscountRequestDto,
    CreateGlobalDiscountRequestDto,
    CreateShopDiscountRequestDto,
    DeleteDiscountRequestDto,
    DiscountClaimResponseDto,
    DiscountResponseDto,
    GetDiscountRequestDto,
    GetDiscountsRequestDto,
    GetDiscountsResponseDto,
    GetMyClaimsRequestDto,
    GetMyClaimsResponseDto,
    UpdateDiscountRequestDto,
} from "./discount.dto";
import {
    DiscountEvaluationContext,
    DiscountEvaluationResult,
} from "./discount.type";
import {
    discountAdminService,
    discountEvaluationService,
    discountManagementService,
    discountShopService,
    discountUserService,
} from "./services";

export class DiscountService {
    claimDiscount(
        dto: ClaimDiscountRequestDto,
    ): Promise<DiscountClaimResponseDto> {
        return discountUserService.claimDiscount(dto);
    }

    consumeClaim(args: {
        claimId: string;
        orderId?: string;
        redeemedAmount: string;
        userId: string;
    }): Promise<void> {
        return discountEvaluationService.consumeClaim(args);
    }

    createGlobalDiscount(
        dto: CreateGlobalDiscountRequestDto,
    ): Promise<DiscountResponseDto> {
        return discountAdminService.createGlobalDiscount(dto);
    }

    createShopDiscount(
        dto: CreateShopDiscountRequestDto,
    ): Promise<DiscountResponseDto> {
        return discountShopService.createShopDiscount(dto);
    }

    deleteDiscount(dto: DeleteDiscountRequestDto): Promise<void> {
        return discountManagementService.deleteDiscount(dto);
    }

    evaluate(
        discountOrId: DiscountEntity | string,
        ctx: DiscountEvaluationContext,
    ): Promise<DiscountEvaluationResult> {
        return discountEvaluationService.evaluate(discountOrId, ctx);
    }

    getBestAutoDiscount(args: {
        ctx: DiscountEvaluationContext;
        discountType: DiscountType;
        scopes: DiscountScope[];
        shopIds?: string[];
    }): Promise<DiscountEvaluationResult | null> {
        return discountEvaluationService.getBestAutoDiscount(args);
    }

    getDiscount(dto: GetDiscountRequestDto): Promise<DiscountResponseDto> {
        return discountManagementService.getDiscount(dto);
    }

    getDiscounts(
        dto: GetDiscountsRequestDto,
    ): Promise<GetDiscountsResponseDto> {
        return discountManagementService.getDiscounts(dto);
    }

    getMyClaims(dto: GetMyClaimsRequestDto): Promise<GetMyClaimsResponseDto> {
        return discountUserService.getMyClaims(dto);
    }

    recordRedemption(args: {
        discountId: string;
        orderId?: string;
        redeemedAmount: string;
        userId: string;
    }): Promise<void> {
        return discountEvaluationService.recordRedemption(args);
    }

    releaseRedemption(orderId: string): Promise<void> {
        return discountEvaluationService.releaseRedemption(orderId);
    }

    updateDiscount(
        dto: UpdateDiscountRequestDto,
    ): Promise<DiscountResponseDto> {
        return discountManagementService.updateDiscount(dto);
    }

    validateCode(
        code: string,
        ctx: DiscountEvaluationContext,
    ): Promise<DiscountEvaluationResult | null> {
        return discountEvaluationService.validateCode(code, ctx);
    }
}

const discountService = new DiscountService();
export default discountService;
