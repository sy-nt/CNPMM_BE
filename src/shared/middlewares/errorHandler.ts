import {
    GENERIC_CONFLICT_MESSAGE,
    GENERIC_INTERNAL_ERROR_MESSAGE,
} from "@shared/constants";
import appLogger from "@shared/lib/logger";
import { isUniqueViolationError } from "@shared/utils/db";
import { NextFunction, Request, Response } from "express";

import { RequestContextService } from "../lib/context";
import {
    ConflictError,
    isHttpError,
    NotFoundError,
} from "../lib/http/httpError";

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
    error: unknown,
): { message: string; statusCode: number } => {
    if (isHttpError(error)) {
        return {
            message: error.message,
            statusCode: error.statusCode ?? 500,
        };
    }
    if (isUniqueViolationError(error)) {
        return {
            message: GENERIC_CONFLICT_MESSAGE,
            statusCode: new ConflictError().statusCode,
        };
    }
    return { message: GENERIC_INTERNAL_ERROR_MESSAGE, statusCode: 500 };
};
