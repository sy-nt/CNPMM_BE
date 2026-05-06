import AppDataSource from "@domain/db/mysql";
import { Base } from "@shared/lib/base/base";
import {
    DefaultPaginationDto,
    KeySetPaginationDto,
    SortDirection,
} from "@shared/types";
import {
    DeepPartial,
    EntityManager,
    EntityTarget,
    FindManyOptions,
    FindOneOptions,
    FindOptionsOrder,
    FindOptionsWhere,
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

    create = async (
        manager: EntityManager,
        data: DeepPartial<T>,
    ): Promise<T> => {
        const entity = this.repository.create(data);
        return manager.save(entity);
    };

    createMany = async (
        manager: EntityManager,
        data: DeepPartial<T>[],
    ): Promise<T[]> => {
        const entities = this.repository.create(data);
        return manager.save(entities);
    };

    delete = async (manager: EntityManager, criteria: FindOptionsWhere<T>) => {
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
            totalPage,
        };
    };

    paginateKeySet = async (
        options: Omit<FindManyOptions<T>, "skip" | "take">,
        paginateOption: KeySetPaginationDto,
    ) => {
        const [items, total] = await this.repository.findAndCount({
            ...options,
            order: this._buildOrder(
                paginateOption.orderBy,
                paginateOption.sort,
            ),
            take: paginateOption.limit,
            where: {
                ...options.where,
                ...(paginateOption.lastId
                    ? { id: MoreThan(paginateOption.lastId) }
                    : {}),
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

    softDelete = async (
        manager: EntityManager,
        criteria: FindOptionsWhere<T>,
    ) => {
        return manager.softDelete(this.repository.target, criteria);
    };

    update = async (
        manager: EntityManager,
        criteria: FindOptionsWhere<T>,
        data: QueryDeepPartialEntity<T>,
    ) => {
        return manager.update(this.repository.target, criteria, data);
    };

    private _buildOrder(
        orderBy?: string,
        sort?: SortDirection,
    ): FindOptionsOrder<T> | undefined {
        if (!orderBy || !sort) return undefined;
        return {
            [orderBy]: sort,
        } as FindOptionsOrder<T>;
    }
}
