import {
    CreatePresignedUrlRequestDto,
    CreatePresignedUrlResponseDto,
} from "../image.dto";
import { ImageBaseService } from "./image.base.service";

export class ImageShopService extends ImageBaseService {
    async createPresignedUrl(
        dto: CreatePresignedUrlRequestDto,
    ): Promise<CreatePresignedUrlResponseDto> {
        return this._createPresignedUrl(dto);
    }
}

const imageShopService = new ImageShopService();
export { imageShopService };
