import { DiscountScope, DiscountType } from "@domain/entities";

import {
    CreateShopDiscountRequestDto,
    DiscountResponseDto,
} from "../discount.dto";
import { DiscountBaseService } from "./discount.base.service";

export class DiscountShopService extends DiscountBaseService {
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
}

const discountShopService = new DiscountShopService();
export { discountShopService };
