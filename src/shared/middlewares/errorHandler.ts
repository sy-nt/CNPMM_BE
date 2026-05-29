import appLogger from "@shared/lib/logger";
import { NextFunction, Request, Response } from "express";

import { RequestContextService } from "../lib/context";
import { HttpError, NotFoundError } from "../lib/http/httpError";

export const handleNotFound = (
    _req: Request,
    _res: Response,
    next: NextFunction,
) => {
    next(new NotFoundError());
};

export const handleError = (
    error: HttpError,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const requestId = RequestContextService.getRequestId();
    const jwtPayload = RequestContextService.getJwtPayload();
    appLogger.error(error.message, {
        context: {
            jwtPayload,
            requestId,
        },
        error,
    });
    return res.status(error.statusCode ?? 500).json({
        data: null,
        message: error.message,
        requestId,
        statusCode: error.statusCode,
    });
};
