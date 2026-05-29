import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { IMAGE_PERMISSIONS } from "./image.constants";
import { imageController } from "./image.controller";
import { createPresignedUrlRequestSchema } from "./image.schema";

const imageRouter = Router();

imageRouter.post(
    "/presigned-url",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access-optional"),
    validator({
        body: createPresignedUrlRequestSchema,
    }),
    rbac([IMAGE_PERMISSIONS.IMAGE_CREATE_PRESIGNED_URL]),
    asyncWrapper(imageController.createPresignedUrl),
);

export default imageRouter;
