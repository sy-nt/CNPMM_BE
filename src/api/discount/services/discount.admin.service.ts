import { DiscountScope } from "@domain/entities";

import {
    CreateGlobalDiscountRequestDto,
    DiscountResponseDto,
} from "../discount.dto";
import { DiscountBaseService } from "./discount.base.service";

export class DiscountAdminService extends DiscountBaseService {
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
}

const discountAdminService = new DiscountAdminService();
export { discountAdminService };
