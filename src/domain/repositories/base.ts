import AppDataSource from "@domain/db/mysql";
import { Base } from "@shared/lib/base/base";
import { RequestContextService } from "@shared/lib/context";
import {
    DefaultPaginationDto,
    KeySetPaginationDto,
    SortDirection,
} from "@shared/types";
import {
    DeepPartial,
    EntityTarget,
    FindManyOptions,
    FindOneOptions,
    FindOptionsOrder,
    FindOptionsWhere,
    LessThan,
    MoreThan,
    ObjectLiteral,
    QueryDeepPartialEntity,
    Repository,
} from "typeorm";

export class BaseRepository<T extends ObjectLiteral> extends Base {
    protected readonly repository: Repository<T>;

    constructor(entity: EntityTarget<T>) {
        super();
        this.repository = AppDataSource.getRepository(entity);
    }

    create = async (data: DeepPartial<T>): Promise<T> => {
        const manager = await this._entityManager();
        const entity = this.repository.create(data);
        return manager.save(entity);
    };

    createMany = async (data: DeepPartial<T>[]): Promise<T[]> => {
        const manager = await this._entityManager();
        const entities = this.repository.create(data);
        return manager.save(entities);
    };

    delete = async (criteria: FindOptionsWhere<T>) => {
        const manager = await this._entityManager();
        return manager.delete(this.repository.target, criteria);
    };

    find = async (options: FindManyOptions<T>): Promise<T[]> => {
        return this.repository.find(options);
    };

    findOne = async (options: FindOneOptions<T>): Promise<null | T> => {
        return this.repository.findOne(options);
    };

    paginate = async (
        options: Omit<FindManyOptions<T>, "skip" | "take">,
        paginateOption: DefaultPaginationDto,
    ) => {
        const [items, total] = await this.repository.findAndCount({
            ...options,
            order: this._buildOrder(
                paginateOption.orderBy,
                paginateOption.sort,
            ),
            skip: (paginateOption.page - 1) * paginateOption.limit,
            take: paginateOption.limit,
        });

        const totalPage = Math.ceil(total / paginateOption.limit);
        return {
            currentPage: paginateOption.page,
            items,
            limit: paginateOption.limit,
            total,
            totalPage,
        };
    };

    paginateKeySet = async (
        options: Omit<FindManyOptions<T>, "skip" | "take">,
        paginateOption: KeySetPaginationDto,
    ) => {
        const isAsc =
            (paginateOption.sort ?? "DESC").toString().toUpperCase() === "ASC";
        const cursor = paginateOption.lastId
            ? {
                  id: isAsc
                      ? MoreThan(paginateOption.lastId)
                      : LessThan(paginateOption.lastId),
              }
            : {};
        const [items, total] = await this.repository.findAndCount({
            ...options,
            order: {
                id: isAsc ? "ASC" : "DESC",
            } as unknown as FindOptionsOrder<T>,
            take: paginateOption.limit,
            where: {
                ...options.where,
                ...cursor,
            } as FindOptionsWhere<T>,
        });

        return {
            hasNextPage: total > items.length,
            items,
            lastId: items[items.length - 1]?.id as string,
        };
    };

    queryBuilder = () => {
        return this.repository.createQueryBuilder();
    };

    softDelete = async (criteria: FindOptionsWhere<T>) => {
        const manager = await this._entityManager();
        return manager.softDelete(this.repository.target, criteria);
    };

    update = async (
        criteria: FindOptionsWhere<T>,
        data: QueryDeepPartialEntity<T>,
    ) => {
        const manager = await this._entityManager();
        return manager.update(this.repository.target, criteria, data);
    };

    private _buildOrder(
        orderBy?: string,
        sort?: SortDirection,
    ): FindOptionsOrder<T> {
        if (orderBy && sort) {
            return { [orderBy]: sort } as FindOptionsOrder<T>;
        }
        return { id: "DESC" } as unknown as FindOptionsOrder<T>;
    }

    private async _entityManager() {
        const queryRunner = await this._queryRunner();
        return queryRunner.manager;
    }

    private async _queryRunner() {
        const ctx = RequestContextService.getContext();
        if (ctx.queryRunner) return ctx.queryRunner;
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        RequestContextService.setQueryRunner(queryRunner);
        return queryRunner;
    }
}
