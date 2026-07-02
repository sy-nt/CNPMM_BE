import { removeNil } from "@shared/utils/object";
import { In } from "typeorm";

import {
    CreateCategoryRequestDto,
    DeleteCategoryRequestDto,
    UpdateCategoryRequestDto,
} from "../category.dto";
import { CategoryBaseService } from "./category.base.service";

export class CategoryManagementService extends CategoryBaseService {
    async createCategory(dto: CreateCategoryRequestDto) {
        await this._assertCanCreateUnder(dto.parentId, dto.shopId);
        const slug = await this._generateUniqueSlug(dto.name, dto.shopId);
        const category = await this.repositories.category.create({
            description: dto.description,
            displayOrder: dto.displayOrder ?? 0,
            iconUrl: dto.iconUrl,
            name: dto.name,
            parentId: dto.parentId,
            shopId: dto.shopId,
            slug,
        });
        await this.repositories.categoryClosure.insertClosureForNewNode(
            category.id,
            dto.parentId,
        );
        return this._toResponse(category);
    }

    async deleteCategory(dto: DeleteCategoryRequestDto) {
        const target = await this._getCategoryOrThrow(dto.id);
        this._assertOwnership(target, dto.callerShopId);
        const subtreeIds =
            await this.repositories.categoryClosure.findSubtreeIds(dto.id);
        await this.repositories.category.softDelete({ id: In(subtreeIds) });
        await this.repositories.categoryClosure.deleteClosureForDescendants(
            subtreeIds,
        );
    }

    async updateCategory(dto: UpdateCategoryRequestDto) {
        const target = await this._getCategoryOrThrow(dto.id);
        this._assertOwnership(target, dto.callerShopId);
        const { callerShopId: _callerShopId, id, ...rest } = dto;
        const updates = removeNil(rest);
        if (Object.keys(updates).length === 0) return target;
        await this.repositories.category.update({ id }, updates);
        return this._getCategoryOrThrow(id);
    }
}

const categoryManagementService = new CategoryManagementService();
export { categoryManagementService };
