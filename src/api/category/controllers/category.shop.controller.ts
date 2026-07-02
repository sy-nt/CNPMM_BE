import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreateCategoryRequestDto,
    UpdateCategoryRequestDto,
} from "../category.dto";
import { categoryManagementService } from "../services";

export class CategoryShopController {
    @CreatedResponse()
    async createCategory(req: Request) {
        const dto = extractRequest<CreateCategoryRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return categoryManagementService.createCategory({
            ...dto,
            shopId: jwtPayload?.assignedShopId,
        });
    }

    @OkResponse()
    async deleteCategory(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return categoryManagementService.deleteCategory({
            callerShopId: jwtPayload?.assignedShopId,
            id,
        });
    }

    @OkResponse()
    async updateCategory(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateCategoryRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return categoryManagementService.updateCategory({
            ...dto,
            callerShopId: jwtPayload?.assignedShopId,
            id,
        });
    }
}

const categoryShopController = new CategoryShopController();
export default categoryShopController;
