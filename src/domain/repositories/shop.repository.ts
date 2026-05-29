import { ShopEntity } from "@domain/entities/shop.entity";

import { BaseRepository } from "./base";

export class ShopRepository extends BaseRepository<ShopEntity> {
    findSlugsByBase = async (baseSlug: string): Promise<string[]> => {
        const rows = await this.repository
            .createQueryBuilder("shop")
            .select("shop.slug", "slug")
            .where("shop.slug = :baseSlug OR shop.slug LIKE :slugPattern", {
                baseSlug,
                slugPattern: `${baseSlug}-%`,
            })
            .getRawMany<{ slug: string }>();

        return rows.map((row) => row.slug);
    };
}

const shopRepository = new ShopRepository(ShopEntity);
export default shopRepository;
