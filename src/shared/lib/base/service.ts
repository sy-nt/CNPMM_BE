import appRedis from "@domain/db/redis";
import repositories, { Repositories } from "@domain/repositories";
import Redis from "ioredis";

import { Base } from "./base";

export abstract class BaseService extends Base {
    protected readonly redis: Redis = appRedis;
    protected readonly repositories: Repositories = repositories;
}
