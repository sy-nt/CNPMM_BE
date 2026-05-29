import config from "@config";
import { Config } from "@config/type";
import AppDataSource from "@domain/db/mysql";
import appRedis from "@domain/db/redis";
import repositories, { Repositories } from "@domain/repositories";
import Redis from "ioredis";

import { Base } from "./base";

export abstract class BaseService extends Base {
    protected readonly config: Config = config;
    protected readonly queryBuilder = AppDataSource.createQueryBuilder();
    protected readonly redis: Redis = appRedis;
    protected readonly repositories: Repositories = repositories;
}
