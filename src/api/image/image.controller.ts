import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { Request } from "express";

import { CreatePresignedUrlRequestDto } from "./image.dto";
import imageService from "./image.service";

export class ImageController {
    @OkResponse()
    async createPresignedUrl(req: Request) {
        const dto = extractRequest<CreatePresignedUrlRequestDto>(req, "body");
        return imageService.createPresignedUrl(dto);
    }
}

export const imageController = new ImageController();
