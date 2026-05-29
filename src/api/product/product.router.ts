import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { rateLimit } from "@shared/lib/rateLimit";
import { authenticator } from "@shared/middlewares/authenticator";
import { rbac } from "@shared/middlewares/rbac";
import { validator } from "@shared/middlewares/validator";
import { Router } from "express";

import { PRODUCT_PERMISSIONS } from "./product.constants";
import productController from "./product.controller";
import {
    createAttributeRequestSchema,
    createAttributeValueRequestSchema,
    createProductRequestSchema,
    createSkuRequestSchema,
    productIdParamsSchema,
    setSkuInventoryRequestSchema,
    setSkuSelectionsRequestSchema,
    updateAttributeRequestBodySchema,
    updateAttributeValueRequestBodySchema,
    updateProductRequestBodySchema,
    updateSkuRequestBodySchema,
} from "./product.schema";

const productRouter = Router();

productRouter.post(
    "/",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ body: createProductRequestSchema }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_CREATE]),
    asyncWrapper(productController.createProduct),
);

productRouter.get(
    "/:id",
    rateLimit({ limit: 30, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: productIdParamsSchema }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_READ]),
    asyncWrapper(productController.getProduct),
);

productRouter.patch(
    "/:id",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateProductRequestBodySchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.updateProduct),
);

productRouter.delete(
    "/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: productIdParamsSchema }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_DELETE]),
    asyncWrapper(productController.deleteProduct),
);

productRouter.post(
    "/:id/sku",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: createSkuRequestSchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.addSku),
);

productRouter.patch(
    "/sku/:id",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateSkuRequestBodySchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.updateSku),
);

productRouter.delete(
    "/sku/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: productIdParamsSchema }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.deleteSku),
);

productRouter.put(
    "/sku/:id/selections",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: setSkuSelectionsRequestSchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.setSkuSelections),
);

productRouter.put(
    "/sku/:id/inventory",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: setSkuInventoryRequestSchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.setSkuInventory),
);

productRouter.post(
    "/:id/attribute",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: createAttributeRequestSchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.addAttribute),
);

productRouter.patch(
    "/attribute/:id",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateAttributeRequestBodySchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.updateAttribute),
);

productRouter.delete(
    "/attribute/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: productIdParamsSchema }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.deleteAttribute),
);

productRouter.post(
    "/attribute/:id/value",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: createAttributeValueRequestSchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.addAttributeValue),
);

productRouter.patch(
    "/attribute-value/:id",
    rateLimit({ limit: 10, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({
        body: updateAttributeValueRequestBodySchema,
        params: productIdParamsSchema,
    }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.updateAttributeValue),
);

productRouter.delete(
    "/attribute-value/:id",
    rateLimit({ limit: 5, scope: "route", windowSeconds: 60 }),
    authenticator("access"),
    validator({ params: productIdParamsSchema }),
    rbac([PRODUCT_PERMISSIONS.PRODUCT_UPDATE]),
    asyncWrapper(productController.deleteAttributeValue),
);

export default productRouter;
