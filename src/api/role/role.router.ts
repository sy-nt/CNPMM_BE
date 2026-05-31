import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { ROLE_PERMISSIONS } from "./role.constants";
import roleController from "./role.controller";
import {
    createRoleRequestSchema,
    deleteRoleRequestParamsSchema,
    getRoleRequestParamsSchema,
    updateRoleRequestBodySchema,
    updateRoleRequestParamsSchema,
} from "./role.schema";

const roleRouter = Router();

roleRouter.get(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    asyncWrapper(roleController.getUserPermissions),
);

roleRouter.get(
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        params: getRoleRequestParamsSchema,
    }),
    rbac([
        ROLE_PERMISSIONS.ROLE_READ,
        ROLE_PERMISSIONS.ROLE_DELETE,
        ROLE_PERMISSIONS.ROLE_UPDATE,
    ]),
    asyncWrapper(roleController.getRole),
);

roleRouter.post(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: createRoleRequestSchema,
    }),
    rbac([ROLE_PERMISSIONS.ROLE_CREATE]),
    asyncWrapper(roleController.createRole),
);

roleRouter.delete(
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        params: deleteRoleRequestParamsSchema,
    }),
    rbac([ROLE_PERMISSIONS.ROLE_DELETE]),
    asyncWrapper(roleController.deleteRole),
);

roleRouter.put(
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateRoleRequestBodySchema,
        params: updateRoleRequestParamsSchema,
    }),
    rbac([ROLE_PERMISSIONS.ROLE_UPDATE]),
    asyncWrapper(roleController.updateRole),
);

export default roleRouter;
