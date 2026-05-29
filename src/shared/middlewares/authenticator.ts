import redis from "@domain/db/redis";
import { GLOBAL_REDIS_KEY_PREFIX, REDIS_TRUTHY_VALUE } from "@shared/constants";
import { RequestContextService } from "@shared/lib/context";
import { UnauthorizedError } from "@shared/lib/http/httpError";
import jwt, { JwtError, JwtTokenType, TokenTypes } from "@shared/lib/jwt";
import { NextFunction, Request, Response } from "express";

export const authenticator = (type: TokenTypes) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const isOptional = type.endsWith("-optional");

        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader)
            return isOptional ? next() : next(new UnauthorizedError());

        const tokenType = type.split("-")[0] as JwtTokenType;
        const token = authorizationHeader.split(" ")[1];
        if (!token) return isOptional ? next() : next(new UnauthorizedError());

        const result = jwt.verifyToken(token, tokenType);
        if (!result.valid) {
            return next(
                new UnauthorizedError(
                    result.reason === "expired"
                        ? JwtError.TOKEN_EXPIRED
                        : JwtError.INVALID_TOKEN,
                ),
            );
        }

        const isLoggedOut = await redis.get(
            `${GLOBAL_REDIS_KEY_PREFIX.AUTH_LOGOUT}:${token}`,
        );
        if (isLoggedOut === REDIS_TRUTHY_VALUE)
            return next(new UnauthorizedError());

        RequestContextService.setJwtPayload(result.payload);
        RequestContextService.setTokens({
            [tokenType === "access" ? "accessToken" : "requestToken"]: token,
        });
        next();
    };
};
