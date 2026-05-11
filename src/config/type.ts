import type { StringValue } from "ms";

import { NodeEnv } from "@shared/types";

export interface AuthConfig {
    jwt: {
        accessTokenExpiresIn: StringValue;
        accessTokenSecretKey: string;
        refreshTokenExpiresIn: StringValue;
        refreshTokenSecretKey: string;
    };
}

export interface Config {
    app: {
        frontendUrl: string;
    };
    auth: AuthConfig;
    db: {
        mysql: MySqlConfig;
        redis: RedisConfig;
    };
    nodeEnv: NodeEnv;
    nodemailer: NodemailerConfig;
    port: number;
}

export interface MySqlConfig {
    database: string;
    host: string;
    password: string;
    port: number;
    username: string;
}

export interface NodemailerConfig {
    email: string;
    password: string;
}

export interface RedisConfig {
    db: number;
    host: string;
    password: string;
    port: number;
    username: string;
}
