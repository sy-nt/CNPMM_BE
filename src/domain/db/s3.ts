import { S3Client } from "@aws-sdk/client-s3";
import config from "@config";

const s3Client = new S3Client({
    credentials: {
        accessKeyId: config.db.s3.accessKeyId,
        secretAccessKey: config.db.s3.secretAccessKey,
    },
    endpoint: config.db.s3.endpoint,
    forcePathStyle: true,
    region: config.db.s3.region,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

export default s3Client;
