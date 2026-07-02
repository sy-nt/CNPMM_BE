import { ImageRepository } from "@domain/repositories/image.repository";
import { ShopRepository } from "@domain/repositories/shop.repository";
import { SkuRepository } from "@domain/repositories/sku.repository";
import { SpuRepository } from "@domain/repositories/spu.repository";
import { UserRepository } from "@domain/repositories/user.repository";
import { BadRequestError } from "@shared/lib/http/httpError";

import { ImageError, ImagePrefix } from "./image.constants";

type ImageRepositories = {
    image: ImageRepository;
    shop: ShopRepository;
    sku: SkuRepository;
    spu: SpuRepository;
    user: UserRepository;
};

export async function claimImageKeys(
    repositories: ImageRepositories,
    keys: Array<string | undefined>,
    expectedPrefix: ImagePrefix,
): Promise<void> {
    const uniqueKeys = [
        ...new Set(keys.filter((key): key is string => Boolean(key))),
    ];
    if (uniqueKeys.length === 0) return;

    const images = await repositories.image.findByKeys(uniqueKeys);
    const imageByKey = new Map(images.map((image) => [image.key, image]));

    for (const key of uniqueKeys) {
        const image = imageByKey.get(key);
        if (!image) {
            throw new BadRequestError(ImageError.IMAGE_NOT_FOUND);
        }
        if (image.usedFor !== expectedPrefix) {
            throw new BadRequestError(ImageError.IMAGE_PREFIX_MISMATCH);
        }
    }

    await repositories.image.markUsed(uniqueKeys);
}

export async function isImageKeyReferenced(
    repositories: ImageRepositories,
    key: string,
): Promise<boolean> {
    const [shop, spu, sku, user] = await Promise.all([
        repositories.shop.findOne({
            select: { id: true },
            where: { imageKey: key },
        }),
        repositories.spu.findOne({
            select: { id: true },
            where: { mainImageKey: key },
        }),
        repositories.sku.findOne({
            select: { id: true },
            where: { imageKey: key },
        }),
        repositories.user.findOne({
            select: { id: true },
            where: { imageKey: key },
        }),
    ]);
    return Boolean(shop || spu || sku || user);
}

export async function loadImageUrlLookup(
    imageRepository: ImageRepository,
    keys: Array<string | undefined>,
): Promise<Map<string, string>> {
    const uniqueKeys = [
        ...new Set(keys.filter((key): key is string => Boolean(key))),
    ];
    if (uniqueKeys.length === 0) return new Map();

    const images = await imageRepository.findByKeys(uniqueKeys);
    return new Map(images.map((image) => [image.key, image.publicUrl]));
}

export async function releaseImageKeysIfOrphaned(
    repositories: ImageRepositories,
    keys: Array<string | undefined>,
): Promise<void> {
    const uniqueKeys = [
        ...new Set(keys.filter((key): key is string => Boolean(key))),
    ];
    for (const key of uniqueKeys) {
        const referenced = await isImageKeyReferenced(repositories, key);
        if (!referenced) {
            await repositories.image.markUnused([key]);
        }
    }
}

export function resolveImageUrl(
    key: string | undefined,
    lookup: Map<string, string>,
): string | undefined {
    if (!key) return undefined;
    return lookup.get(key);
}
