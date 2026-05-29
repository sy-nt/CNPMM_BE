import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import config from "@config/index";
import s3Client from "@domain/db/s3";
import imageRepository from "@domain/repositories/image.repository";
import { createTask } from "node-cron";

const taskRemoveUnusedImages = createTask("0 0 * * *", async () => {
    const images = await imageRepository.find({
        where: {
            isUsed: false,
        },
    });

    await s3Client.send(
        new DeleteObjectsCommand({
            Bucket: config.db.s3.bucket,
            Delete: {
                Objects: images.map((image) => {
                    return { Key: image.key };
                }),
            },
        }),
    );

    await imageRepository.delete({
        isUsed: false,
    });
});

taskRemoveUnusedImages.start();
