import type { StringValue } from "ms";

import config from "@config";
import jwtLib from "jsonwebtoken";

export type JwtPayload = {
    userId: string;
};
export type JwtTokenType = "access" | "refresh";
export type OptionalJwtTokenType = `${JwtTokenType}-optional`;
export type TokenTypes = JwtTokenType | OptionalJwtTokenType;

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

    verifyToken(token: string, type: JwtTokenType) {
        try {
            const result = jwtLib.verify(
                token,
                type === "access"
                    ? this.configs.accessTokenSecretKey
                    : this.configs.refreshTokenSecretKey,
            );
            return result as JwtPayload;
        } catch {
            return null;
        }
    }
}

const jwt = new Jwt(config.auth.jwt);
export default jwt;
