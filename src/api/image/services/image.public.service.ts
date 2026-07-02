import {
    CreatePresignedUrlRequestDto,
    CreatePresignedUrlResponseDto,
} from "../image.dto";
import { ImageBaseService } from "./image.base.service";

export class ImagePublicService extends ImageBaseService {
    async createPresignedUrl(
        dto: CreatePresignedUrlRequestDto,
    ): Promise<CreatePresignedUrlResponseDto> {
        return this._createPresignedUrl(dto);
    }
}

const imagePublicService = new ImagePublicService();
export { imagePublicService };
