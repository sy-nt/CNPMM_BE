import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "@domain/db/s3";
import { BaseService } from "@shared/lib/base/service";
import { v4 as uuidV4 } from "uuid";

import { IMAGE_PRESIGNED_URL_EXPIRATION_TIME_SECONDS } from "./image.constants";
import { CreatePresignedUrlRequestDto } from "./image.dto";

export class ImageService extends BaseService {
    private readonly s3Client: S3Client;

    constructor() {
        super();
        this.s3Client = s3Client;
    }
    async createPresignedUrl(dto: CreatePresignedUrlRequestDto) {
        const fileKey = `${dto.prefix}/${uuidV4()}.${dto.extension}`;
        const command = new PutObjectCommand({
            Bucket: this.config.db.s3.bucket,
            ContentType: `image/${dto.extension}`,
            Key: fileKey,
        });
        const presignedUrl = await getSignedUrl(this.s3Client, command, {
            expiresIn: IMAGE_PRESIGNED_URL_EXPIRATION_TIME_SECONDS,
        });

        const endpoint = this.config.db.s3.endpoint.replace(/\/+$/, "");
        await this.repositories.image.create({
            isUsed: false,
            key: fileKey,
            publicUrl: `${endpoint}/${this.config.db.s3.bucket}/${fileKey}`,
            size: dto.size,
            usedFor: dto.prefix,
        });
        return {
            fileKey,
            uploadUrl: presignedUrl,
        };
    }
}

const imageService = new ImageService();
export default imageService;
