import { DiscountClaimEntity } from "@domain/entities";
import { DefaultPaginationDto, SortDirection } from "@shared/types";
import { In, SelectQueryBuilder } from "typeorm";

import { BaseRepository } from "./base";

export class DiscountClaimRepository extends BaseRepository<DiscountClaimEntity> {
    constructor() {
        super(DiscountClaimEntity);
    }

    countActiveByDiscount = async (discountId: string): Promise<number> => {
        return this.repository.count({ where: { discountId } });
    };

    countActiveByDiscountAndUser = async (
        discountId: string,
        userId: string,
    ): Promise<number> => {
        return this.repository.count({ where: { discountId, userId } });
    };

    findActiveByUser = async (
        userId: string,
        pagination: DefaultPaginationDto,
    ): Promise<{
        currentPage: number;
        items: DiscountClaimEntity[];
        limit: number;
        total: number;
        totalPage: number;
    }> => {
        const qb = this._buildActiveByUserQuery(userId);
        this._applyPagination(qb, pagination);
        const [items, total] = await qb.getManyAndCount();
        return {
            currentPage: pagination.page,
            items,
            limit: pagination.limit,
            total,
            totalPage: Math.ceil(total / pagination.limit),
        };
    };

    findByIdsForUser = async (
        ids: string[],
        userId: string,
    ): Promise<DiscountClaimEntity[]> => {
        if (ids.length === 0) return [];
        return this.repository.find({
            relations: { discount: true },
            where: { id: In(ids), userId },
        });
    };

    private _applyPagination(
        qb: SelectQueryBuilder<DiscountClaimEntity>,
        pagination: DefaultPaginationDto,
    ): void {
        const sort: SortDirection = pagination.sort ?? "DESC";
        qb.orderBy(
            `claim.${this._mapOrderBy(pagination.orderBy)}`,
            sort.toString().toUpperCase() as "ASC" | "DESC",
        )
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit);
    }

    private _buildActiveByUserQuery(
        userId: string,
    ): SelectQueryBuilder<DiscountClaimEntity> {
        return this.repository
            .createQueryBuilder("claim")
            .innerJoinAndSelect("claim.discount", "d")
            .where("claim.user_id = :userId", { userId })
            .andWhere("d.is_active = 1")
            .andWhere("(d.valid_from IS NULL OR d.valid_from <= NOW())")
            .andWhere("(d.valid_until IS NULL OR d.valid_until >= NOW())")
            .andWhere("(d.max_uses IS NULL OR d.used_count < d.max_uses)");
    }

    private _mapOrderBy(orderBy?: string): string {
        switch (orderBy) {
            case "createdAt":
            default:
                return "createdAt";
        }
    }
}

const discountClaimRepository = new DiscountClaimRepository();
export default discountClaimRepository;
