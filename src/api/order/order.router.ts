import { Router } from "express";

import {
    orderCheckoutRouter,
    orderLifecycleRouter,
    orderQueryRouter,
} from "./routers";

const orderRouter = Router();

orderRouter.use(orderCheckoutRouter);
orderRouter.use(orderQueryRouter);
orderRouter.use(orderLifecycleRouter);

export default orderRouter;
