import { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler<T> = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<T>;

export const asyncWrapper =
    <T>(fn: AsyncRequestHandler<T>): RequestHandler =>
    (req, res, next) => {
        fn(req, res, next).catch(next);
    };
