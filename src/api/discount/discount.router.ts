import { Router } from "express";

import { discountAdminRouter, discountShopRouter } from "./routers";

const discountRouter = Router();

discountRouter.use(discountShopRouter);
discountRouter.use(discountAdminRouter);

export default discountRouter;
