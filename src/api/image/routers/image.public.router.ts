import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { imagePublicController } from "../controllers";
import { IMAGE_PERMISSIONS } from "../image.constants";
import { createPublicPresignedUrlRequestSchema } from "../image.schema";

const imagePublicRouter = Router();

imagePublicRouter.post(
    "/presigned-url",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({
        body: createPublicPresignedUrlRequestSchema,
    }),
    rbac([IMAGE_PERMISSIONS.IMAGE_CREATE_PRESIGNED_URL]),
    asyncWrapper(imagePublicController.createPresignedUrl),
);

export { imagePublicRouter };
