import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { Request } from "express";

import { CreatePresignedUrlRequestDto } from "../image.dto";
import { imageShopService } from "../services";

export class ImageShopController {
    @OkResponse()
    async createPresignedUrl(req: Request) {
        const dto = extractRequest<CreatePresignedUrlRequestDto>(req, "body");
        return imageShopService.createPresignedUrl(dto);
    }
}

const imageShopController = new ImageShopController();
export { imageShopController };
