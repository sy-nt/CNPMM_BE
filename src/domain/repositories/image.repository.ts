import { ImageEntity } from "@domain/entities/image.entity";
import { In, LessThan } from "typeorm";

import { BaseRepository } from "./base";

export class ImageRepository extends BaseRepository<ImageEntity> {
    constructor() {
        super(ImageEntity);
    }

    async deleteByKeys(keys: string[]): Promise<void> {
        if (keys.length === 0) return;
        await this.delete({ key: In(keys) });
    }

    async findByKeys(keys: string[]): Promise<ImageEntity[]> {
        if (keys.length === 0) return [];
        return this.find({
            where: {
                key: In(keys),
            },
        });
    }

    async findUnusedCreatedBefore(createdBefore: Date): Promise<ImageEntity[]> {
        return this.find({
            where: {
                createdAt: LessThan(createdBefore),
                isUsed: false,
            },
        });
    }

    async markUnused(keys: string[]): Promise<void> {
        if (keys.length === 0) return;
        await this.update({ key: In(keys) }, { isUsed: false });
    }

    async markUsed(keys: string[]): Promise<void> {
        if (keys.length === 0) return;
        await this.update({ key: In(keys) }, { isUsed: true });
    }
}

const imageRepository = new ImageRepository();
export default imageRepository;
