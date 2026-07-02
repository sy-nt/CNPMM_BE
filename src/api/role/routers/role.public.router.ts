import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { Router } from "express";

import roleController from "../role.controller";

const rolePublicRouter = Router();

rolePublicRouter.get(
    "/",
    rateLimit({ limit: 50, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    asyncWrapper(roleController.getUserPermissions),
);

export { rolePublicRouter };
