import appRedis from "@domain/db/redis";
import { RequestContextService } from "@shared/lib/context";
import { NextFunction, Request, Response } from "express";

import { TooManyRequestsError } from "../http/httpError";

type RateLimitOptions = {
    keyPrefix?: string;
    limit: number;
    scope?: "global" | "route" | "user";
    windowSeconds: number;
};

const SLIDING_WINDOW_BUCKETED_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

local currentBucket = math.floor(now / 1000)
local windowStart = currentBucket - math.floor(window / 1000)

-- remove old buckets
redis.call("ZREMRANGEBYSCORE", key, "-inf", windowStart)

-- sum counts
local buckets = redis.call("ZRANGE", key, 0, -1, "WITHSCORES")
local total = 0
for i = 1, #buckets, 2 do
    local count = redis.call("HGET", key .. ":counts", buckets[i]) or "0"
    total = total + tonumber(count)
end

if total >= limit then
    redis.call("EXPIRE", key, window / 1000)
    redis.call("EXPIRE", key .. ":counts", window / 1000)
    return {0, limit - total, window}
end

-- increment current bucket
redis.call("ZADD", key, currentBucket, currentBucket)
redis.call("HINCRBY", key .. ":counts", currentBucket, 1)

redis.call("EXPIRE", key, window / 1000)
redis.call("EXPIRE", key .. ":counts", window / 1000)

return {1, limit - total - 1, window}
`;

export const rateLimit = (options: RateLimitOptions) => {
    const windowMs = options.windowSeconds * 1000;
    const keyPrefix = options.keyPrefix ?? "rl";
    const scope = options.scope ?? "global";

    return async (req: Request, res: Response, next: NextFunction) => {
        const key = buildKey(req, scope, keyPrefix);
        // skip user limiter if not authenticated
        if (!key) return next();

        const result = await consume(key, options.limit, windowMs);

        setHeaders(res, options.limit, result);

        if (result.allowed) return next();

        res.setHeader("Retry-After", Math.ceil(result.retryAfterMs / 1000));

        return next(new TooManyRequestsError());
    };
};

const buildKey = (
    req: Request,
    scope: "global" | "route" | "user",
    prefix: string,
) => {
    const ip = getIp(req);
    const userId = RequestContextService.getJwtPayload()?.userId;

    if (scope === "global") {
        return `${prefix}:g:${ip}`;
    }

    if (scope === "user") {
        if (!userId) return null;
        return `${prefix}:u:${userId}`;
    }

    const actor = userId ?? ip;
    const route = `${req.method}:${req.baseUrl}${req.route?.path ?? ""}`;

    return `${prefix}:r:${actor}:${route}`;
};

const consume = async (key: string, limit: number, windowMs: number) => {
    const res = (await appRedis.eval(
        SLIDING_WINDOW_BUCKETED_SCRIPT,
        1,
        key,
        Date.now(),
        windowMs,
        limit,
    )) as [number, number, number];

    return {
        allowed: res[0] === 1,
        remaining: Math.max(res[1], 0),
        retryAfterMs: Math.max(res[2], 0),
    };
};

const getIp = (req: Request) => {
    const xfwd = req.headers["x-forwarded-for"];
    if (typeof xfwd === "string") {
        return xfwd.split(",")[0].trim();
    }
    return req.socket.remoteAddress || "unknown";
};

const setHeaders = (
    res: Response,
    limit: number,
    result: { remaining: number; retryAfterMs: number },
) => {
    res.setHeader("RateLimit-Limit", limit);
    res.setHeader("RateLimit-Remaining", result.remaining);
    res.setHeader(
        "RateLimit-Reset",
        Math.ceil((Date.now() + result.retryAfterMs) / 1000),
    );
};

export const appRateLimit = rateLimit({
    limit: 1000,
    scope: "global",
    windowSeconds: 60,
});

export const userRateLimit = rateLimit({
    limit: 600,
    scope: "user",
    windowSeconds: 60,
});
