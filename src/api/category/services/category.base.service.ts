import { CategoryEntity } from "@domain/entities/category.entity";
import { BaseService } from "@shared/lib/base/service";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@shared/lib/http/httpError";
import slugify from "slugify";

import { CATEGORY_MAX_DEPTH, CategoryError } from "../category.constants";
import { CategoryResponseDto } from "../category.dto";
import { CategoryTreeNode } from "../category.type";

export abstract class CategoryBaseService extends BaseService {
    protected async _assertCanCreateUnder(
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

    protected _assertOwnership(
        category: CategoryEntity,
        callerShopId?: string,
    ): void {
        if (callerShopId === undefined) return;
        if (category.shopId !== callerShopId) {
            throw new ForbiddenError(CategoryError.CATEGORY_FORBIDDEN);
        }
    }

    protected _buildTree(
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

    protected async _generateUniqueSlug(
        name: string,
        shopId?: string,
    ): Promise<string> {
        const baseSlug = slugify(name, { lower: true, strict: true });
        const existing = new Set(
            await this.repositories.category.findSlugsByBase(baseSlug, shopId),
        );
        if (!existing.has(baseSlug)) return baseSlug;
        let suffix = 2;
        while (existing.has(`${baseSlug}-${suffix}`)) suffix++;
        return `${baseSlug}-${suffix}`;
    }

    protected async _getCategoryOrThrow(id: string): Promise<CategoryEntity> {
        const category = await this.repositories.category.findOne({
            where: { id },
        });
        if (!category) {
            throw new NotFoundError(CategoryError.CATEGORY_NOT_FOUND);
        }
        return category;
    }

    protected _toResponse(category: CategoryEntity): CategoryResponseDto {
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
