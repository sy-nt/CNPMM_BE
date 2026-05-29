import { RequestContextService } from "@shared/lib/context";
import { NextFunction, Request, Response } from "express";

export const contextMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const ctx = new RequestContextService();
    return ctx.runWithContext(req, res, next);
};
