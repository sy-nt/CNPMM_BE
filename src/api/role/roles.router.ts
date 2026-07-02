import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { ROLE_PERMISSIONS } from "./role.constants";
import roleController from "./role.controller";
import { getRolesRequestQuerySchema } from "./role.schema";

const rolesRouter = Router();

rolesRouter.get(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        query: getRolesRequestQuerySchema,
    }),
    rbac([ROLE_PERMISSIONS.ROLE_READ]),
    asyncWrapper(roleController.getRoles),
);

rolesRouter.get(
    "/permissions/system",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([ROLE_PERMISSIONS.ROLE_READ]),
    asyncWrapper(roleController.getPermissions),
);

export default rolesRouter;
