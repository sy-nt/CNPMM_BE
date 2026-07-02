import AppDataSource from "@domain/db/mysql";
import { AsyncLocalStorage } from "async_hooks";
import { NextFunction, Request, Response } from "express";
import { QueryRunner } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { JwtPayload } from "../jwt";

type AfterCommitCallback = () => Promise<void> | void;

export class RequestContext {
    public afterCommitCallbacks: AfterCommitCallback[] = [];

    constructor(
        public tokens?: {
            accessToken?: string;
            requestToken?: string;
        },
        public requestId?: string,
        public jwtPayload?: JwtPayload,
        public shopId?: null | string,
        public queryRunner?: QueryRunner,
    ) {}
}

export class RequestContextService {
    private static readonly ctx = new AsyncLocalStorage<RequestContext>();

    static getContext = () => {
        const context = RequestContextService.ctx.getStore();
        if (!context) throw new Error("Request context not found");
        return context;
    };

    static getJwtPayload = () => {
        const ctx = RequestContextService.getContext();
        return ctx.jwtPayload;
    };

    static getQueryRunner = () => {
        const ctx = RequestContextService.getContext();
        return ctx.queryRunner;
    };

    static getRequestId = () => {
        const ctx = RequestContextService.getContext();
        return ctx.requestId;
    };

    static getShopId = () => {
        const ctx = RequestContextService.getContext();
        return ctx.shopId;
    };

    static getTokens = () => {
        const ctx = RequestContextService.getContext();
        return ctx.tokens;
    };

    static registerAfterCommit = (callback: AfterCommitCallback) => {
        const ctx = RequestContextService.getContext();
        ctx.afterCommitCallbacks.push(callback);
    };

    static setJwtPayload = (jwtPayload: JwtPayload) => {
        const ctx = RequestContextService.getContext();
        ctx.jwtPayload = jwtPayload;
        RequestContextService.ctx.enterWith(ctx);
    };

    static setQueryRunner = (queryRunner: QueryRunner) => {
        const ctx = RequestContextService.getContext();
        ctx.queryRunner = queryRunner;
        RequestContextService.ctx.enterWith(ctx);
    };

    static setRequestId = (requestId: string) => {
        const ctx = RequestContextService.getContext();
        ctx.requestId = requestId;
        RequestContextService.ctx.enterWith(ctx);
    };

    static setShopId = (shopId: null | string) => {
        const ctx = RequestContextService.getContext();
        ctx.shopId = shopId;
        RequestContextService.ctx.enterWith(ctx);
    };

    static setTokens = (tokens: {
        accessToken?: string;
        requestToken?: string;
    }) => {
        const ctx = RequestContextService.getContext();
        ctx.tokens = tokens;
        RequestContextService.ctx.enterWith(ctx);
    };

    async runWithContext(req: Request, _res: Response, next: NextFunction) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const requestId = (req.headers["x-request-id"] as string) ?? uuidv4();
        const context = new RequestContext();
        context.queryRunner = queryRunner;
        context.requestId = requestId;
        RequestContextService.ctx.enterWith(context);

        next();
    }
}
