import { extractContext } from "@shared/lib/context";
import appLogger from "@shared/lib/logger";
import { NextFunction, Request, Response } from "express";

type Func<T> = (req: Request, res: Response, next: NextFunction) => Promise<T>;

export const asyncWrapper = <T>(fn: Func<T>) => {
    return (req: Request, res: Response, next: NextFunction) =>
        fn(req, res, next).catch((error) => {
            const context = extractContext();
            appLogger.error(error.message, {
                context,
                error,
            });
            next(error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as T as any;
};
