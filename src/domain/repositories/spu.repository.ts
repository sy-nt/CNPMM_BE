import { SpuEntity } from "@domain/entities";
import { DefaultPaginationDto, SortDirection } from "@shared/types";
import { FindOptionsWhere, In, SelectQueryBuilder } from "typeorm";

import { BaseRepository } from "./base";

const FULLTEXT_BOOLEAN_OPERATORS = /[+\-><()~*"@]/g;

export type SpuListFilters = {
    categoryIds?: string[];
    isActive?: boolean;
    search?: string;
    shopId?: string;
};

export type SpuSummaryRow = {
    categoryId: string;
    id: string;
    isActive: boolean;
    mainImageKey?: null | string;
    name: string;
    price: string;
    shopId: string;
    slug: string;
    soldCount: number;
};

export class SpuRepository extends BaseRepository<SpuEntity> {
    constructor() {
        super(SpuEntity);
    }

    bumpSoldCount = async (spuId: string, delta: number): Promise<number> => {
        const manager = await this._entityManager();
        const result = await manager
            .createQueryBuilder()
            .update(SpuEntity)
            .set({ soldCount: () => "sold_count + :delta" })
            .where("id = :id", { id: spuId })
            .setParameter("delta", delta)
            .execute();
        return result.affected ?? 0;
    };

    decrementSoldCount = async (
        spuId: string,
        delta: number,
    ): Promise<number> => {
        const manager = await this._entityManager();
        const result = await manager
            .createQueryBuilder()
            .update(SpuEntity)
            .set({ soldCount: () => "sold_count - :delta" })
            .where("id = :id", { id: spuId })
            .andWhere("sold_count >= :delta")
            .setParameter("delta", delta)
            .execute();
        return result.affected ?? 0;
    };

    // eslint-disable-next-line max-lines-per-function
    findDetailWithRelations = async (
        idOrSlug: string,
        opts?: { onlyActive?: boolean },
    ): Promise<null | SpuEntity> => {
        const qb = this.repository
            .createQueryBuilder("spu")
            .leftJoinAndMapOne(
                "spu.category",
                "categories",
                "cat",
                "cat.id = spu.category_id AND cat.deleted_at IS NULL",
            )
            .leftJoinAndMapMany(
                "spu.skus",
                "skus",
                "sku",
                "sku.spu_id = spu.id AND sku.deleted_at IS NULL",
            )
            .leftJoinAndMapMany(
                "spu.attributes",
                "product_attributes",
                "attr",
                "attr.spu_id = spu.id AND attr.deleted_at IS NULL",
            )
            .leftJoinAndMapMany(
                "attr.values",
                "product_attribute_values",
                "av",
                "av.attribute_id = attr.id AND av.deleted_at IS NULL",
            )
            .leftJoinAndMapMany(
                "sku.selections",
                "sku_attribute_values",
                "sav",
                "sav.sku_id = sku.id",
            )
            .leftJoinAndMapOne(
                "spu.shop",
                "shops",
                "shop",
                "shop.id = spu.shop_id",
            )
            .where("spu.id = :idOrSlug OR spu.slug = :idOrSlug", { idOrSlug });

        if (opts?.onlyActive) {
            qb.andWhere("spu.is_active = 1").andWhere("spu.deleted_at IS NULL");
        }

        return qb.getOne();
    };

    findSlugsByBase = async (
        shopId: string,
        baseSlug: string,
    ): Promise<string[]> => {
        const rows = await this.repository
            .createQueryBuilder("spu")
            .select("spu.slug", "slug")
            .where("spu.shop_id = :shopId", { shopId })
            .andWhere("(spu.slug = :baseSlug OR spu.slug LIKE :slugPattern)", {
                baseSlug,
                slugPattern: `${baseSlug}-%`,
            })
            .getRawMany<{ slug: string }>();
        return rows.map((row) => row.slug);
    };

    findSummariesPaginated = async (
        filters: SpuListFilters,
        pagination: DefaultPaginationDto,
    ): Promise<{
        currentPage: number;
        items: SpuSummaryRow[];
        limit: number;
        total: number;
        totalPage: number;
    }> => {
        const qb = this._buildSummaryBaseQuery();
        this._applySummaryFilters(qb, filters);
        this._applySummaryPagination(qb, pagination);
        const [items, total] = await qb.getManyAndCount();
        return {
            currentPage: pagination.page,
            items: items.map((s) => this._toSummary(s)),
            limit: pagination.limit,
            total,
            totalPage: Math.ceil(total / pagination.limit),
        };
    };

    findSummaryByIdOrSlug = async (
        idOrSlug: string,
        extraWhere?: FindOptionsWhere<SpuEntity>,
    ): Promise<null | SpuEntity> => {
        return this.repository.findOne({
            where: [
                { id: idOrSlug, ...extraWhere },
                { slug: idOrSlug, ...extraWhere },
            ],
        });
    };

    findSummaryByIds = async (ids: string[]): Promise<SpuEntity[]> => {
        if (ids.length === 0) return [];
        return this.repository.find({
            where: { id: In(ids) },
        });
    };

    private _applySummaryFilters(
        qb: SelectQueryBuilder<SpuEntity>,
        filters: SpuListFilters,
    ): void {
        if (filters.shopId) {
            qb.andWhere("spu.shop_id = :shopId", { shopId: filters.shopId });
        }
        if (filters.categoryIds && filters.categoryIds.length > 0) {
            qb.andWhere("spu.category_id IN (:...categoryIds)", {
                categoryIds: filters.categoryIds,
            });
        }
        if (filters.isActive !== undefined) {
            qb.andWhere("spu.is_active = :isActive", {
                isActive: filters.isActive,
            });
        }
        if (filters.search) {
            const booleanQuery = this._toFullTextBooleanQuery(filters.search);
            if (booleanQuery) {
                qb.andWhere(
                    "MATCH(spu.name, spu.description) AGAINST (:search IN BOOLEAN MODE)",
                    { search: booleanQuery },
                );
            }
        }
    }

    private _applySummaryPagination(
        qb: SelectQueryBuilder<SpuEntity>,
        pagination: DefaultPaginationDto,
    ): void {
        const orderBy = this._mapOrderBy(pagination.orderBy);
        const sort: SortDirection = pagination.sort ?? "DESC";
        qb.orderBy(
            `spu.${orderBy}`,
            sort.toString().toUpperCase() as "ASC" | "DESC",
        )
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit);
    }

    private _buildSummaryBaseQuery(): SelectQueryBuilder<SpuEntity> {
        return this.repository
            .createQueryBuilder("spu")
            .select([
                "spu.id",
                "spu.shopId",
                "spu.categoryId",
                "spu.name",
                "spu.slug",
                "spu.price",
                "spu.mainImageKey",
                "spu.isActive",
                "spu.soldCount",
            ]);
    }

    private _mapOrderBy(orderBy?: string): string {
        switch (orderBy) {
            case "name":
                return "name";
            case "price":
                return "price";
            case "soldCount":
                return "sold_count";
            case "createdAt":
            default:
                return "createdAt";
        }
    }

    private _toFullTextBooleanQuery(raw: string): null | string {
        const tokens = raw
            .replace(FULLTEXT_BOOLEAN_OPERATORS, " ")
            .trim()
            .split(/\s+/)
            .filter((token) => token.length > 0);
        if (tokens.length === 0) return null;
        return tokens.map((token) => `+${token}*`).join(" ");
    }

    private _toSummary(s: SpuEntity): SpuSummaryRow {
        return {
            categoryId: s.categoryId,
            id: s.id,
            isActive: s.isActive,
            mainImageKey: s.mainImageKey,
            name: s.name,
            price: s.price,
            shopId: s.shopId,
            slug: s.slug,
            soldCount: s.soldCount,
        };
    }
}

const spuRepository = new SpuRepository();
export default spuRepository;
