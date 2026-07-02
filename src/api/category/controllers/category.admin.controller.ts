import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { Request } from "express";

import {
    CreateCategoryRequestDto,
    UpdateCategoryRequestDto,
} from "../category.dto";
import { categoryManagementService } from "../services";

export class CategoryAdminController {
    @CreatedResponse()
    async createCategory(req: Request) {
        const dto = extractRequest<CreateCategoryRequestDto>(req, "body");
        return categoryManagementService.createCategory(dto);
    }

    @OkResponse()
    async deleteCategory(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        return categoryManagementService.deleteCategory({ id });
    }

    @OkResponse()
    async updateCategory(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateCategoryRequestDto>(req, "body");
        return categoryManagementService.updateCategory({ ...dto, id });
    }
}

const categoryAdminController = new CategoryAdminController();
export default categoryAdminController;
