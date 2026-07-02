import { Router } from "express";

import { addressesShopRouter, addressShopRouter } from "./address/routers";
import { categoryShopRouter } from "./category/routers";
import { discountShopRouter, discountsShopRouter } from "./discount/routers";
import { imageShopRouter } from "./image/routers";
import inventoryRouter from "./inventory/inventory.router";
import productRouter from "./product/product.router";
import productsRouter from "./product/products.router";
import shopModuleRouter from "./shop/shop.router";
import warehouseRouter from "./warehouse/warehouse.router";
import warehousesRouter from "./warehouse/warehouses.router";

const shopRouter = Router();

shopRouter.use("/address", addressShopRouter);
shopRouter.use("/addresses", addressesShopRouter);
shopRouter.use("/category", categoryShopRouter);
shopRouter.use("/discount", discountShopRouter);
shopRouter.use("/discounts", discountsShopRouter);
shopRouter.use("/image", imageShopRouter);
shopRouter.use("/inventory", inventoryRouter);
shopRouter.use("/product", productRouter);
shopRouter.use("/products", productsRouter);
shopRouter.use("/warehouse", warehouseRouter);
shopRouter.use("/warehouses", warehousesRouter);
shopRouter.use("/", shopModuleRouter);

export default shopRouter;
