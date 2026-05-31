import { CategoryEntity } from "@domain/entities/category.entity";
import { BaseService } from "@shared/lib/base/service";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import slugify from "slugify";
import { In, IsNull } from "typeorm";

import { CATEGORY_MAX_DEPTH, CategoryError } from "./category.constants";
import {
    CategoryResponseDto,
    CreateCategoryRequestDto,
    DeleteCategoryRequestDto,
    GetCategoryTreeRequestDto,
    GetSystemCategoriesRequestDto,
    UpdateCategoryRequestDto,
} from "./category.dto";
import { CategoryTreeNode } from "./category.type";

export class CategoryService extends BaseService {
    async createCategory(dto: CreateCategoryRequestDto) {
        await this._assertCanCreateUnder(dto.parentId, dto.shopId);
        const slug = await this._generateUniqueSlug(dto.name);
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

    async getCategoryTree(dto: GetCategoryTreeRequestDto) {
        const root = await this._getCategoryOrThrow(dto.id);
        const depthRows =
            await this.repositories.categoryClosure.findSubtreeDepths(
                dto.id,
                dto.depth,
            );
        const ids = depthRows.map((row) => row.descendantId);
        const categories = await this.repositories.category.find({
            order: { displayOrder: "ASC" },
            where: { id: In(ids) },
        });
        return this._buildTree(root.id, categories, depthRows);
    }

    async getSystemCategories(dto: GetSystemCategoriesRequestDto) {
        return this.repositories.category.paginate(
            {
                select: {
                    description: true,
                    iconUrl: true,
                    id: true,
                    name: true,
                    slug: true,
                },
                where: { shopId: IsNull() },
            },
            dto,
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

    private async _assertCanCreateUnder(
        parentId?: string,
        callerShopId?: string,
    ): Promise<void> {
        if (!parentId) return;
        const parent = await this.repositories.category.findOne({
            select: { id: true, shopId: true },
            where: { id: parentId },
        });
        if (!parent) {
            throw new BadRequestError(CategoryError.CATEGORY_PARENT_NOT_FOUND);
        }
        if (callerShopId && parent.shopId && parent.shopId !== callerShopId) {
            throw new ForbiddenError(CategoryError.CATEGORY_FORBIDDEN);
        }
        const parentDepth =
            await this.repositories.categoryClosure.findParentDepth(parentId);
        if (parentDepth + 1 >= CATEGORY_MAX_DEPTH) {
            throw new BadRequestError(
                CategoryError.CATEGORY_MAX_DEPTH_EXCEEDED,
            );
        }
    }

    private _assertOwnership(
        category: CategoryEntity,
        callerShopId?: string,
    ): void {
        if (callerShopId === undefined) return;
        if (category.shopId !== callerShopId) {
            throw new ForbiddenError(CategoryError.CATEGORY_FORBIDDEN);
        }
    }

    private _buildTree(
        rootId: string,
        categories: CategoryEntity[],
        depthRows: { depth: number; descendantId: string }[],
    ): CategoryTreeNode | undefined {
        const depthById = new Map(
            depthRows.map((row) => [row.descendantId, row.depth]),
        );
        const byId = new Map<string, CategoryTreeNode>();
        for (const cat of categories) {
            byId.set(cat.id, {
                ...this._toResponse(cat),
                children: [],
                depth: depthById.get(cat.id) ?? 0,
            });
        }
        for (const node of byId.values()) {
            if (node.id === rootId) continue;
            if (!node.parentId) continue;
            const parent = byId.get(node.parentId);
            if (parent) parent.children.push(node);
        }
        return byId.get(rootId);
    }

    private async _generateUniqueSlug(name: string): Promise<string> {
        const baseSlug = slugify(name, { lower: true, strict: true });
        const existing = new Set(
            await this.repositories.category.findSlugsByBase(baseSlug),
        );
        if (!existing.has(baseSlug)) return baseSlug;
        let suffix = 2;
        while (existing.has(`${baseSlug}-${suffix}`)) suffix++;
        return `${baseSlug}-${suffix}`;
    }

    private async _getCategoryOrThrow(id: string): Promise<CategoryEntity> {
        const category = await this.repositories.category.findOne({
            where: { id },
        });
        if (!category) {
            throw new NotFoundError(CategoryError.CATEGORY_NOT_FOUND);
        }
        return category;
    }

    private _toResponse(category: CategoryEntity): CategoryResponseDto {
        return {
            description: category.description,
            displayOrder: category.displayOrder,
            iconUrl: category.iconUrl,
            id: category.id,
            name: category.name,
            parentId: category.parentId,
            slug: category.slug,
        };
    }
}

const categoryService = new CategoryService();
export default categoryService;
