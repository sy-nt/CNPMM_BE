import { Router } from "express";

import { addressesPublicRouter, addressPublicRouter } from "./address/routers";
import authRouter from "./auth/auth.router";
import cartRouter from "./cart/cart.router";
import {
    categoriesPublicRouter,
    categoryPublicRouter,
} from "./category/routers";
import deliveriesRouter from "./delivery/deliveries.router";
import deliveryRouter from "./delivery/delivery.router";
import { discountPublicRouter, discountsUserRouter } from "./discount/routers";
import { imagePublicRouter } from "./image/routers";
import notificationRouter from "./notification/notification.router";
import notificationsRouter from "./notification/notifications.router";
import orderRouter from "./order/order.router";
import ordersRouter from "./order/orders.router";
import productRouter from "./product/product.router";
import productsRouter from "./product/products.router";
import { rolePublicRouter } from "./role/routers/role.public.router";
import shopsRouter from "./shop/shops.router";
import userRouter from "./user/user.router";

const publicRouter = Router();

publicRouter.use("/address", addressPublicRouter);
publicRouter.use("/addresses", addressesPublicRouter);
publicRouter.use("/auth", authRouter);
publicRouter.use("/cart", cartRouter);
publicRouter.use("/categories", categoriesPublicRouter);
publicRouter.use("/category", categoryPublicRouter);
publicRouter.use("/deliveries", deliveriesRouter);
publicRouter.use("/delivery", deliveryRouter);
publicRouter.use("/discount", discountPublicRouter);
publicRouter.use("/discounts", discountsUserRouter);
publicRouter.use("/image", imagePublicRouter);
publicRouter.use("/notification", notificationRouter);
publicRouter.use("/notifications", notificationsRouter);
publicRouter.use("/order", orderRouter);
publicRouter.use("/orders", ordersRouter);
publicRouter.use("/product", productRouter);
publicRouter.use("/products", productsRouter);
publicRouter.use("/role", rolePublicRouter);
publicRouter.use("/shops", shopsRouter);
publicRouter.use("/user", userRouter);

export default publicRouter;
