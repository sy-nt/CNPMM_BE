import { extractContext } from "@shared/lib/context";
import { NextFunction, Request, Response } from "express";

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
    const context = extractContext();
    return res.status(error.statusCode ?? 500).json({
        data: null,
        message: error.message,
        requestId: context.requestId,
        statusCode: error.statusCode,
    });
};
