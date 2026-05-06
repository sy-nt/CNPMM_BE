import { ImageEntity } from "@domain/entities/image.entity";

import { BaseRepository } from "./base";

export class ImageRepository extends BaseRepository<ImageEntity> {}
const imageRepository = new ImageRepository(ImageEntity);
export default imageRepository;
