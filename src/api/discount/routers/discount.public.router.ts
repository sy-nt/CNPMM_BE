import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import discountUserController from "../controllers/discount.user.controller";
import { DISCOUNT_PERMISSIONS } from "../discount.constants";
import { discountIdParamsSchema } from "../discount.schema";

const discountPublicRouter = Router();

discountPublicRouter.post(
    "/:id/claim",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: discountIdParamsSchema }),
    rbac([DISCOUNT_PERMISSIONS.DISCOUNT_CLAIM]),
    asyncWrapper(discountUserController.claimDiscount),
);

export { discountPublicRouter };
