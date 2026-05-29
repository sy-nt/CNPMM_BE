import { ImagePrefix } from "./image.constants";

export type CreatePresignedUrlRequestDto = {
    extension: string;
    prefix: ImagePrefix;
    size: number;
};
