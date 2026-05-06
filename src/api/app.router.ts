import express from "express";

import setUpAuthRouter from "./auth/auth.router";
import setUpHealthCheckRouter from "./healthCheck/healthCheck.router";
import setUpUserRouter from "./user/user.router";

const routerV1 = express.Router();
setUpHealthCheckRouter(routerV1);
setUpUserRouter(routerV1);
setUpAuthRouter(routerV1);

const router = express.Router();
router.use("/v1", routerV1);

export default router;
