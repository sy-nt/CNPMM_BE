import { In, IsNull } from "typeorm";

import {
    GetCategoryTreeRequestDto,
    GetSystemCategoriesRequestDto,
} from "../category.dto";
import { CategoryBaseService } from "./category.base.service";

export class CategoryPublicService extends CategoryBaseService {
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
                where: { parentId: IsNull(), shopId: IsNull() },
            },
            dto,
        );
    }
}

const categoryPublicService = new CategoryPublicService();
export { categoryPublicService };
