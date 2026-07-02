import { SHOP_IMAGE_PERMISSIONS } from "@api/shop/shop.constants";
import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { imageShopController } from "../controllers";
import { createShopPresignedUrlRequestSchema } from "../image.schema";

const imageShopRouter = Router();

imageShopRouter.post(
    "/presigned-url",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: createShopPresignedUrlRequestSchema,
    }),
    rbac([SHOP_IMAGE_PERMISSIONS.SHOP_IMAGE_CREATE_PRESIGNED_URL]),
    asyncWrapper(imageShopController.createPresignedUrl),
);

export { imageShopRouter };
