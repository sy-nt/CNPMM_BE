import { Router } from "express";

import adminRouter from "./admin.router";
import healthCheckRouter from "./healthCheck/healthCheck.router";
import publicRouter from "./public.router";
import shopRouter from "./shop.router";

const router = Router();

router.use("/health-check", healthCheckRouter);
router.use("/admin", adminRouter);
router.use("/shop", shopRouter);
router.use("/", publicRouter);

export default router;
