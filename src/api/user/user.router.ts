import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { USER_PERMISSIONS } from "./user.constants";
import userController from "./user.controller";
import { updateUserRequestSchema } from "./user.schema";

const userRouter = Router();
userRouter.get(
    "/",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([USER_PERMISSIONS.USER_READ]),
    asyncWrapper(userController.getUser),
);

userRouter.patch(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateUserRequestSchema,
    }),
    rbac([USER_PERMISSIONS.USER_UPDATE]),
    asyncWrapper(userController.updateUser),
);

userRouter.delete(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([USER_PERMISSIONS.USER_DELETE]),
    asyncWrapper(userController.deleteUser),
);

userRouter.post(
    "/block",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    rbac([USER_PERMISSIONS.USER_BLOCK]),
    asyncWrapper(userController.blockUser),
);

export default userRouter;
