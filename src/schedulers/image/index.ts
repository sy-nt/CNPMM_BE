import { IMAGE_UNUSED_CLEANUP_GRACE_PERIOD_MS } from "@api/image/image.constants";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import config from "@config/index";
import s3Client from "@domain/db/s3";
import imageRepository from "@domain/repositories/image.repository";
import { createTask } from "node-cron";

const taskRemoveUnusedImages = createTask("0 0 * * *", async () => {
    const createdBefore = new Date(
        Date.now() - IMAGE_UNUSED_CLEANUP_GRACE_PERIOD_MS,
    );
    const images = await imageRepository.findUnusedCreatedBefore(createdBefore);
    if (images.length === 0) return;

    await s3Client.send(
        new DeleteObjectsCommand({
            Bucket: config.db.s3.bucket,
            Delete: {
                Objects: images.map((image) => ({ Key: image.key })),
            },
        }),
    );

    await imageRepository.deleteByKeys(images.map((image) => image.key));
});

taskRemoveUnusedImages.start();
