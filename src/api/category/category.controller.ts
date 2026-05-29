import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreateCategoryRequestDto,
    GetSystemCategoriesRequestDto,
    UpdateCategoryRequestDto,
} from "./category.dto";
import categoryService from "./category.service";

export class CategoryController {
    @CreatedResponse()
    async createCategory(req: Request) {
        const dto = extractRequest<CreateCategoryRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return categoryService.createCategory({
            ...dto,
            shopId: jwtPayload?.assignedShopId,
        });
    }

    @OkResponse()
    async deleteCategory(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return categoryService.deleteCategory({
            callerShopId: jwtPayload?.assignedShopId,
            id,
        });
    }

    @OkResponse()
    async getCategoryTree(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const { depth } = extractRequest<{ depth: number }>(req, "query");
        return categoryService.getCategoryTree({ depth, id });
    }

    @OkResponse()
    async getSystemCategories(req: Request) {
        const dto = extractRequest<GetSystemCategoriesRequestDto>(req, "query");
        return categoryService.getSystemCategories(dto);
    }

    @OkResponse()
    async updateCategory(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateCategoryRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return categoryService.updateCategory({
            ...dto,
            callerShopId: jwtPayload?.assignedShopId,
            id,
        });
    }
}

const categoryController = new CategoryController();
export default categoryController;
