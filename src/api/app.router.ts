import { Router } from "express";

import addressRouter from "./address/address.router";
import addressesRouter from "./address/addresses.router";
import authRouter from "./auth/auth.router";
import healthCheckRouter from "./healthCheck/healthCheck.router";
import imageRouter from "./image/image.router";
import roleRouter from "./role/role.router";
import rolesRouter from "./role/roles.router";
import shopRouter from "./shop/shop.router";
import shopsRouter from "./shop/shops.router";
import userRouter from "./user/user.router";
import usersRouter from "./user/users.router";

const router = Router();

router.use("/health-check", healthCheckRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/users", usersRouter);
router.use("/address", addressRouter);
router.use("/addresses", addressesRouter);
router.use("/image", imageRouter);
router.use("/role", roleRouter);
router.use("/roles", rolesRouter);
router.use("/shop", shopRouter);
router.use("/shops", shopsRouter);

export default router;
