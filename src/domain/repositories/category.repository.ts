import { CategoryEntity } from "../entities/category.entity";
import { BaseRepository } from "./base";

export class CategoryRepository extends BaseRepository<CategoryEntity> {
    constructor() {
        super(CategoryEntity);
    }

    findSlugsByBase = async (baseSlug: string): Promise<string[]> => {
        const rows = await this.repository
            .createQueryBuilder("category")
            .select("category.slug", "slug")
            .where(
                "category.slug = :baseSlug OR category.slug LIKE :slugPattern",
                {
                    baseSlug,
                    slugPattern: `${baseSlug}-%`,
                },
            )
            .getRawMany<{ slug: string }>();

        return rows.map((row) => row.slug);
    };
}

const categoryRepository = new CategoryRepository();
export default categoryRepository;
