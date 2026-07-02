import {
    DiscountRule,
    DiscountScope,
    DiscountType,
    DiscountValueType,
} from "@domain/entities";
import { DefaultPaginationDto, DefaultPaginationResponse } from "@shared/types";

export interface ClaimDiscountRequestDto {
    callerUserId: string;
    id: string;
}

export interface CreateGlobalDiscountRequestDto {
    code?: string;
    description?: string;
    discountType: DiscountType;
    isActive?: boolean;
    maxDiscountAmount?: string;
    maxUses?: number;
    maxUsesPerUser?: number;
    name: string;
    rules: DiscountRule[];
    scope: DiscountScope;
    shopId?: string;
    targetSpuIds?: string[];
    validFrom?: Date;
    validUntil?: Date;
    value: string;
    valueType: DiscountValueType;
}

export interface CreateShopDiscountRequestDto {
    code?: string;
    description?: string;
    isActive?: boolean;
    maxDiscountAmount?: string;
    maxUses?: number;
    maxUsesPerUser?: number;
    name: string;
    rules: DiscountRule[];
    shopId: string;
    targetSpuIds?: string[];
    validFrom?: Date;
    validUntil?: Date;
    value: string;
    valueType: DiscountValueType;
}

export interface DeleteDiscountRequestDto {
    callerRoleId?: string;
    callerShopId?: string;
    id: string;
}

export interface DiscountClaimResponseDto {
    claimedAt: Date;
    discount: DiscountClaimSummaryDto;
    id: string;
    userId: string;
}

export interface DiscountClaimSummaryDto {
    code?: string;
    description?: string;
    discountType: DiscountType;
    id: string;
    maxDiscountAmount?: string;
    name: string;
    scope: DiscountScope;
    shopId?: string;
    validFrom?: Date;
    validUntil?: Date;
    value: string;
    valueType: DiscountValueType;
}

export interface DiscountResponseDto {
    code?: string;
    description?: string;
    discountType: DiscountType;
    id: string;
    isActive: boolean;
    maxDiscountAmount?: string;
    maxUses?: number;
    maxUsesPerUser?: number;
    name: string;
    rules: DiscountRule[];
    scope: DiscountScope;
    shopId?: string;
    targetSpuIds: string[];
    usedCount: number;
    validFrom?: Date;
    validUntil?: Date;
    value: string;
    valueType: DiscountValueType;
}

export interface GetDiscountRequestDto {
    callerRoleId?: string;
    callerShopId?: string;
    id: string;
}

export interface GetDiscountsRequestDto extends DefaultPaginationDto {
    callerRoleId?: string;
    callerShopId?: string;
    code?: string;
    discountType?: DiscountType;
    isActive?: boolean;
    scope?: DiscountScope;
}

export type GetDiscountsResponseDto =
    DefaultPaginationResponse<DiscountResponseDto>;

export interface GetMyClaimsRequestDto extends DefaultPaginationDto {
    callerUserId: string;
}

export type GetMyClaimsResponseDto =
    DefaultPaginationResponse<DiscountClaimResponseDto>;

export interface ListPlatformDiscountsRequestDto extends DefaultPaginationDto {
    discountType?: DiscountType;
}

export type ListPlatformDiscountsResponseDto =
    DefaultPaginationResponse<PlatformDiscountSummaryDto>;

export interface PlatformDiscountSummaryDto {
    code?: string;
    description?: string;
    discountType: DiscountType;
    id: string;
    maxDiscountAmount?: string;
    name: string;
    rules: DiscountRule[];
    scope: DiscountScope;
    validFrom?: Date;
    validUntil?: Date;
    value: string;
    valueType: DiscountValueType;
}

export interface UpdateDiscountRequestDto {
    callerRoleId?: string;
    callerShopId?: string;
    code?: null | string;
    description?: null | string;
    id: string;
    isActive?: boolean;
    maxDiscountAmount?: null | string;
    maxUses?: null | number;
    maxUsesPerUser?: null | number;
    name?: string;
    rules?: DiscountRule[];
    targetSpuIds?: string[];
    validFrom?: Date | null;
    validUntil?: Date | null;
    value?: string;
    valueType?: DiscountValueType;
}
