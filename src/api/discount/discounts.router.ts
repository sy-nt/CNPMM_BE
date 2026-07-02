import { Router } from "express";

import {
    discountsAdminRouter,
    discountsShopRouter,
    discountsUserRouter,
} from "./routers";

const discountsRouter = Router();

discountsRouter.use(discountsUserRouter);
discountsRouter.use(discountsShopRouter);
discountsRouter.use(discountsAdminRouter);

export default discountsRouter;
