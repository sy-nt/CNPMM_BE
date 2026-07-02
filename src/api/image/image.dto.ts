import { ImagePrefix } from "./image.constants";

export type CreatePresignedUrlRequestDto = {
    extension: string;
    prefix: ImagePrefix;
    size: number;
};

export type CreatePresignedUrlResponseDto = {
    fileKey: string;
    uploadUrl: string;
};
