import { Router } from "express";

import { ordersQueryRouter } from "./routers";

const ordersRouter = Router();

ordersRouter.use(ordersQueryRouter);

export default ordersRouter;
