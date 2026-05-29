import { RequestContextService } from "@shared/lib/context";
import { ForbiddenError } from "@shared/lib/http/httpError";
import { PermissionName } from "@shared/lib/rbac/rbac.constants";
import rbacService from "@shared/lib/rbac/rbac.service";
import { NextFunction, Request, Response } from "express";

export const rbac = (requirePermissions: PermissionName[]) => {
    return async (_req: Request, _res: Response, next: NextFunction) => {
        const jwtPayload = RequestContextService.getJwtPayload();
        let permissions: PermissionName[] = [];
        try {
            if (!jwtPayload) {
                permissions = await rbacService.getGuestPermissions();
            } else {
                permissions = await rbacService.getPermissions(
                    jwtPayload.roleId,
                );
            }
        } catch (error) {
            return next(error);
        }

        const hasEnoughPermissions = requirePermissions.every((permission) =>
            permissions.includes(permission),
        );
        if (!hasEnoughPermissions) return next(new ForbiddenError());
        return next();
    };
};
