import rbacService from "@shared/lib/rbac/rbac.service";

import {
    DeleteDiscountRequestDto,
    DiscountResponseDto,
    GetDiscountRequestDto,
    GetDiscountsRequestDto,
    GetDiscountsResponseDto,
    UpdateDiscountRequestDto,
} from "../discount.dto";
import { DiscountBaseService } from "./discount.base.service";

export class DiscountManagementService extends DiscountBaseService {
    async deleteDiscount(dto: DeleteDiscountRequestDto): Promise<void> {
        const discount = await this._getDiscountOrThrow(dto.id);
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        this._assertDiscountAccess(discount, dto.callerShopId, isAdmin);
        await this.repositories.discount.softDelete({ id: dto.id });
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
}

const discountManagementService = new DiscountManagementService();
export { discountManagementService };
