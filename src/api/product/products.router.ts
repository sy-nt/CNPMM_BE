import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { PRODUCT_PERMISSIONS } from "./product.constants";
import productController from "./product.controller";
import { getProductsRequestQuerySchema } from "./product.schema";

const productsRouter = Router();

productsRouter.get(
    "/",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ query: getProductsRequestQuerySchema }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_READ]),
    asyncWrapper(productController.getProducts),
);

export default productsRouter;
