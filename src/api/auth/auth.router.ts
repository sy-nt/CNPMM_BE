import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import authController from "./auth.controller";
import {
    activateAccountRequestSchema,
    forgotPasswordRequestSchema,
    loginRequestSchema,
    resetPasswordRequestSchema,
    signUpRequestSchema,
} from "./auth.schema";

const authRouter = Router();

authRouter.post(
    "/login",
    validator({
        body: loginRequestSchema,
    }),
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    asyncWrapper(authController.login),
);
authRouter.post(
    "/sign-up",
    validator({
        body: signUpRequestSchema,
    }),
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    asyncWrapper(authController.signUp),
);

authRouter.post(
    "/logout",
    authenticator("refresh"),
    asyncWrapper(authController.logout),
);
authRouter.post(
    "/refresh-token",
    authenticator("refresh"),
    asyncWrapper(authController.refreshToken),
);

authRouter.post(
    "/activate-account",
    validator({
        body: activateAccountRequestSchema,
    }),
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    asyncWrapper(authController.activateAccount),
);
authRouter.post(
    "/forgot-password",
    validator({
        body: forgotPasswordRequestSchema,
    }),
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    asyncWrapper(authController.forgotPassword),
);

authRouter.post(
    "/reset-password",
    validator({
        body: resetPasswordRequestSchema,
    }),
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    asyncWrapper(authController.resetPassword),
);

authRouter.get(
    "/status",
    authenticator("access"),
    asyncWrapper(authController.status),
);

export default authRouter;
