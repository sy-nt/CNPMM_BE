import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { authorizer } from "@shared/middlewares/authorizer";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import userController from "./user.controller";
import { getUsersRequestSchema, updateUserRequestSchema } from "./user.schema";

export default function setUpUserRouter(router: Router) {
    const PREFIX = "/user";

    router.get(
        `${PREFIX}/`,
        authenticator("access"),
        asyncWrapper(userController.getUser),
    );

    router.get(
        `${PREFIX}s/`,
        validator({
            query: getUsersRequestSchema,
        }),
        authenticator("access"),
        authorizer("admin"),
        asyncWrapper(userController.getUsers),
    );

    router.patch(
        `${PREFIX}/`,
        validator({
            body: updateUserRequestSchema,
        }),
        authenticator("access"),
        rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
        asyncWrapper(userController.updateUser),
    );

    router.delete(
        `${PREFIX}/`,
        authenticator("access"),
        authorizer("admin"),
        asyncWrapper(userController.deleteUser),
    );
}
