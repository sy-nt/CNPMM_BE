import appLogger from "@shared/lib/logger";
import { NextFunction, Request, Response } from "express";
import { QueryFailedError } from "typeorm";

import { RequestContextService } from "../lib/context";
import { ConflictError, HttpError, NotFoundError } from "../lib/http/httpError";

const MYSQL_DUP_ENTRY_CODE = "ER_DUP_ENTRY";
const GENERIC_DB_ERROR_MESSAGE = "Internal server error";
const GENERIC_CONFLICT_MESSAGE = "Resource already exists";

export const handleNotFound = (
    _req: Request,
    _res: Response,
    next: NextFunction,
) => {
    next(new NotFoundError());
};

export const handleError = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const requestId = RequestContextService.getRequestId();
    const jwtPayload = RequestContextService.getJwtPayload();
    const normalized = _normalizeError(error);
    appLogger.error(error.message, {
        context: {
            jwtPayload,
            requestId,
        },
        error,
    });
    return res.status(normalized.statusCode).json({
        data: null,
        message: normalized.message,
        requestId,
        statusCode: normalized.statusCode,
    });
};

const _normalizeError = (
    error: Error,
): { message: string; statusCode: number } => {
    if (error instanceof HttpError) {
        return {
            message: error.message,
            statusCode: error.statusCode ?? 500,
        };
    }
    if (error instanceof QueryFailedError) {
        const code = (error as { code?: string } & QueryFailedError).code;
        if (code === MYSQL_DUP_ENTRY_CODE) {
            return {
                message: GENERIC_CONFLICT_MESSAGE,
                statusCode: new ConflictError().statusCode,
            };
        }
        return { message: GENERIC_DB_ERROR_MESSAGE, statusCode: 500 };
    }
    return { message: GENERIC_DB_ERROR_MESSAGE, statusCode: 500 };
};
