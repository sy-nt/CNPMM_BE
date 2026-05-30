import appRedis from "@domain/db/redis";
import { GLOBAL_REDIS_KEY_PREFIX } from "@shared/constants";
import { RequestContextService } from "@shared/lib/context";
import { BadRequestError, ConflictError } from "@shared/lib/http/httpError";
import appLogger from "@shared/lib/logger";
import { NextFunction, Request, Response } from "express";

interface CachedResponse {
    body: unknown;
    statusCode: number;
}

interface IdempotencyOptions {
    required?: boolean;
    ttlSeconds?: number;
}

const DEFAULT_TTL_SECONDS = 60 * 60 * 24;
const IDEMPOTENCY_HEADER = "idempotency-key";
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const PENDING_MARKER = "__pending__";

export enum IdempotencyError {
    IDEMPOTENCY_KEY_IN_PROGRESS = "Another request with the same Idempotency-Key is in progress",
    IDEMPOTENCY_KEY_INVALID = "Idempotency-Key header must be 8-128 characters of [A-Za-z0-9_-]",
    IDEMPOTENCY_KEY_REQUIRED = "Idempotency-Key header is required for this endpoint",
}

export const idempotency = (options: IdempotencyOptions = {}) => {
    const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const required = options.required ?? false;

    return async (req: Request, res: Response, next: NextFunction) => {
        const headerValue = req.header(IDEMPOTENCY_HEADER);

        if (!headerValue) {
            if (required) {
                return next(
                    new BadRequestError(
                        IdempotencyError.IDEMPOTENCY_KEY_REQUIRED,
                    ),
                );
            }
            return next();
        }

        if (!KEY_PATTERN.test(headerValue)) {
            return next(
                new BadRequestError(IdempotencyError.IDEMPOTENCY_KEY_INVALID),
            );
        }

        const cacheKey = _buildCacheKey(req, headerValue);
        return _claimOrReplay(cacheKey, ttl, res, next);
    };
};

const _buildCacheKey = (req: Request, headerValue: string): string => {
    const userId = RequestContextService.getJwtPayload()?.userId ?? "anon";
    const route = `${req.method}:${req.baseUrl}${req.route?.path ?? ""}`;
    return `${GLOBAL_REDIS_KEY_PREFIX.IDEMPOTENCY}${userId}:${route}:${headerValue}`;
};

const _claimOrReplay = async (
    cacheKey: string,
    ttl: number,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const claimed = await appRedis.set(
        cacheKey,
        PENDING_MARKER,
        "EX",
        ttl,
        "NX",
    );

    if (claimed === "OK") {
        _wrapResponseCapture(res, cacheKey, ttl);
        return next();
    }

    const existing = await appRedis.get(cacheKey);
    if (existing === null) {
        await appRedis.set(cacheKey, PENDING_MARKER, "EX", ttl);
        _wrapResponseCapture(res, cacheKey, ttl);
        return next();
    }

    if (existing === PENDING_MARKER) {
        return next(
            new ConflictError(IdempotencyError.IDEMPOTENCY_KEY_IN_PROGRESS),
        );
    }

    return _replayCachedResponse(existing, res, next);
};

const _persistResponseSnapshot = (
    statusCode: number,
    body: unknown,
    cacheKey: string,
    ttl: number,
): void => {
    const isSuccess = statusCode >= 200 && statusCode < 300;
    if (isSuccess) {
        const payload: CachedResponse = { body, statusCode };
        appRedis
            .set(cacheKey, JSON.stringify(payload), "EX", ttl)
            .catch((err: Error) =>
                appLogger.warn(
                    `idempotency cache set failed key=${cacheKey} err=${err.message}`,
                ),
            );
        return;
    }
    appRedis
        .del(cacheKey)
        .catch((err: Error) =>
            appLogger.warn(
                `idempotency cache release failed key=${cacheKey} err=${err.message}`,
            ),
        );
};

const _replayCachedResponse = (
    existing: string,
    res: Response,
    next: NextFunction,
): void => {
    let cached: CachedResponse;
    try {
        cached = JSON.parse(existing) as CachedResponse;
    } catch {
        appLogger.warn(
            `idempotency cache corrupt entry, dropping (len=${existing.length})`,
        );
        return next();
    }
    res.status(cached.statusCode).json(cached.body);
};

const _wrapResponseCapture = (
    res: Response,
    cacheKey: string,
    ttl: number,
): void => {
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
        _persistResponseSnapshot(res.statusCode, body, cacheKey, ttl);
        return originalJson(body);
    };
};
