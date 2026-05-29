import type { StringValue } from "ms";

import config from "@config";
import jwtLib from "jsonwebtoken";

export enum JwtError {
    INVALID_TOKEN = "Invalid token",
    TOKEN_EXPIRED = "Token expired",
}

export type JwtPayload = {
    assignedShopId?: string;
    roleId: string;
    userId: string;
};
export type JwtTokenType = "access" | "refresh";
export type OptionalJwtTokenType = `${JwtTokenType}-optional`;
export type TokenTypes = JwtTokenType | OptionalJwtTokenType;
export type VerifyTokenResult =
    | { payload: JwtPayload; valid: true }
    | { reason: "expired" | "invalid"; valid: false };

export class Jwt {
    constructor(
        private readonly configs: {
            accessTokenExpiresIn: StringValue;
            accessTokenSecretKey: string;
            refreshTokenExpiresIn: StringValue;
            refreshTokenSecretKey: string;
        },
    ) {}

    generateTokens(payload: JwtPayload) {
        const accessToken = jwtLib.sign(
            payload,
            this.configs.accessTokenSecretKey,
            {
                algorithm: "HS256",
                expiresIn: this.configs.accessTokenExpiresIn,
            },
        );
        const refreshToken = jwtLib.sign(
            payload,
            this.configs.refreshTokenSecretKey,
            {
                algorithm: "HS256",
                expiresIn: this.configs.refreshTokenExpiresIn,
            },
        );

        return { accessToken, refreshToken };
    }

    verifyToken(token: string, type: JwtTokenType): VerifyTokenResult {
        try {
            const payload = jwtLib.verify(
                token,
                type === "access"
                    ? this.configs.accessTokenSecretKey
                    : this.configs.refreshTokenSecretKey,
            ) as JwtPayload;
            return { payload, valid: true };
        } catch (error) {
            if (error instanceof jwtLib.TokenExpiredError) {
                return { reason: "expired", valid: false };
            }
            return { reason: "invalid", valid: false };
        }
    }
}

const jwt = new Jwt(config.auth.jwt);
export default jwt;
