import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { USER_PERMISSIONS } from "./user.constants";
import userController from "./user.controller";
import {
    assignModeratorRequestSchema,
    getUsersRequestSchema,
} from "./user.schema";

const usersRouter = Router();
usersRouter.post(
    "/moderator",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: assignModeratorRequestSchema }),
    rbac([USER_PERMISSIONS.USER_UPDATE]),
    asyncWrapper(userController.assignModerator),
);

usersRouter.get(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        query: getUsersRequestSchema,
    }),
    rbac([USER_PERMISSIONS.USER_READ, USER_PERMISSIONS.USER_BLOCK]),
    asyncWrapper(userController.getUsers),
);

export default usersRouter;
