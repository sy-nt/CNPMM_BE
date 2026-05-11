import * as dotenv from "dotenv";
import joi from "joi";

import type { Config } from "./type";

dotenv.config();

const envSchema = joi.object<Config>({
    app: joi.object({
        frontendUrl: joi.string().required(),
    }),
    auth: joi.object({
        jwt: joi.object({
            accessTokenExpiresIn: joi.string().default("1h"),
            accessTokenSecretKey: joi.string().required(),
            refreshTokenExpiresIn: joi.string().default("7d"),
            refreshTokenSecretKey: joi.string().required(),
        }),
    }),
    db: joi.object({
        mysql: joi.object({
            database: joi.string().required(),
            host: joi.string().required(),
            password: joi.string().required(),
            port: joi.number().required(),
            username: joi.string().required(),
        }),
        redis: joi.object({
            db: joi.number().required(),
            host: joi.string().required(),
            password: joi.string().optional().default(""),
            port: joi.number().required(),
            username: joi.string().optional().default(""),
        }),
    }),
    nodeEnv: joi.string().valid("DEV", "STAG", "PROD").default("DEV"),
    nodemailer: joi.object({
        email: joi.string().required(),
        password: joi.string().required(),
    }),
    port: joi.number().default(3000),
});

// eslint-disable-next-line max-lines-per-function
const initConfig = () => {
    const validated = envSchema.validate(
        {
            app: {
                frontendUrl: process.env.FRONTEND_URL,
            },
            auth: {
                jwt: {
                    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
                    accessTokenSecretKey: process.env.ACCESS_TOKEN_SECRET_KEY,
                    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
                    refreshTokenSecretKey: process.env.REFRESH_TOKEN_SECRET_KEY,
                },
            },
            db: {
                mysql: {
                    database: process.env.MYSQL_DATABASE,
                    host: process.env.MYSQL_HOST,
                    password: process.env.MYSQL_PASSWORD,
                    port: process.env.MYSQL_PORT,
                    username: process.env.MYSQL_USERNAME,
                },
                redis: {
                    db: process.env.REDIS_DB,
                    host: process.env.REDIS_HOST,
                    password: process.env.REDIS_PASSWORD,
                    port: process.env.REDIS_PORT,
                    username: process.env.REDIS_USERNAME,
                },
            },
            nodeEnv: process.env.NODE_ENV,
            nodemailer: {
                email: process.env.NODEMAILER_EMAIL,
                password: process.env.NODEMAILER_PASSWORD,
            },
            port: process.env.PORT,
        },
        {
            abortEarly: false,
            convert: true,
        },
    );
    if (validated.error) {
        throw new Error(
            `Invalid environment variables: ${validated.error.message}`,
        );
    }
    return validated.value;
};

const config = initConfig();
export default config;
