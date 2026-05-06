import userService from "@api/user/user.service";
import { extractContext } from "@shared/lib/context";
import { ForbiddenError } from "@shared/lib/http/httpError";
import { NextFunction, Request, Response } from "express";

export const authorizer = (role: string) => {
    return async (_req: Request, _res: Response, next: NextFunction) => {
        const context = extractContext();
        const userRoles = await userService.getCacheUserRoles(
            context.jwtPayload!.userId,
        );
        if (!userRoles.includes(role)) {
            return next(new ForbiddenError());
        }
        return next();
    };
};
