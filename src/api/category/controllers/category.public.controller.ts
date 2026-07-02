import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { Request } from "express";

import { GetSystemCategoriesRequestDto } from "../category.dto";
import { categoryPublicService } from "../services";

export class CategoryPublicController {
    @OkResponse()
    async getCategoryTree(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const { depth } = extractRequest<{ depth: number }>(req, "query");
        return categoryPublicService.getCategoryTree({ depth, id });
    }

    @OkResponse()
    async getSystemCategories(req: Request) {
        const dto = extractRequest<GetSystemCategoriesRequestDto>(req, "query");
        return categoryPublicService.getSystemCategories(dto);
    }
}

const categoryPublicController = new CategoryPublicController();
export default categoryPublicController;
