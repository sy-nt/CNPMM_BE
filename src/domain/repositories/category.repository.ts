import { CategoryEntity } from "../entities/category.entity";
import { BaseRepository } from "./base";

export class CategoryRepository extends BaseRepository<CategoryEntity> {
    constructor() {
        super(CategoryEntity);
    }

    findSlugsByBase = async (
        baseSlug: string,
        shopId?: string,
    ): Promise<string[]> => {
        const qb = this.repository
            .createQueryBuilder("category")
            .select("category.slug", "slug")
            .where(
                "category.slug = :baseSlug OR category.slug LIKE :slugPattern",
                {
                    baseSlug,
                    slugPattern: `${baseSlug}-%`,
                },
            );

        if (shopId) {
            qb.andWhere("category.shop_id = :shopId", { shopId });
        } else {
            qb.andWhere("category.shop_id IS NULL");
        }

        const rows = await qb.getRawMany<{ slug: string }>();

        return rows.map((row) => row.slug);
    };
}

const categoryRepository = new CategoryRepository();
export default categoryRepository;
