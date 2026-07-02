import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { Request } from "express";

import { CreatePresignedUrlRequestDto } from "../image.dto";
import { imagePublicService } from "../services";

export class ImagePublicController {
    @OkResponse()
    async createPresignedUrl(req: Request) {
        const dto = extractRequest<CreatePresignedUrlRequestDto>(req, "body");
        return imagePublicService.createPresignedUrl(dto);
    }
}

const imagePublicController = new ImagePublicController();
export { imagePublicController };
