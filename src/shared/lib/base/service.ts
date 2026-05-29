import config from "@config";
import { Config } from "@config/type";
import appRedis from "@domain/db/redis";
import repositories, { Repositories } from "@domain/repositories";
import Redis from "ioredis";

import { RequestContextService } from "../context";
import { Base } from "./base";

export abstract class BaseService extends Base {
    get queryBuilder() {
        const qb = RequestContextService.getQueryRunner()!;
        return qb.manager.createQueryBuilder();
    }

    protected readonly config: Config = config;
    protected readonly redis: Redis = appRedis;

    protected readonly repositories: Repositories = repositories;
}
