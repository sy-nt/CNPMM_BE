import { ImageEntity } from "@domain/entities/image.entity";

import { BaseRepository } from "./base";

export class ImageRepository extends BaseRepository<ImageEntity> {
    constructor() {
        super(ImageEntity);
    }
}

const imageRepository = new ImageRepository();
export default imageRepository;
