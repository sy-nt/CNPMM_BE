import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import authController from "./auth.controller";
import {
    activateAccountRequestSchema,
    loginRequestSchema,
    signUpRequestSchema,
} from "./auth.schema";

export default function setUpAuthRouter(router: Router) {
    const PREFIX = "/auth";

    router.post(
        `${PREFIX}/login`,
        validator({
            body: loginRequestSchema,
        }),
        rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
        asyncWrapper(authController.login),
    );
    router.post(
        `${PREFIX}/sign-up`,
        validator({
            body: signUpRequestSchema,
        }),
        rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
        asyncWrapper(authController.signUp),
    );

    router.post(
        `${PREFIX}/logout`,
        authenticator("refresh"),
        asyncWrapper(authController.logout),
    );
    router.post(
        `${PREFIX}/refresh-token`,
        authenticator("refresh"),
        asyncWrapper(authController.refreshToken),
    );

    router.post(
        `${PREFIX}/activate-account`,
        validator({
            body: activateAccountRequestSchema,
        }),
        rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
        asyncWrapper(authController.activateAccount),
    );
}
