import { Router } from "express";

import { categoryAdminRouter } from "./category/routers";
import { discountAdminRouter, discountsAdminRouter } from "./discount/routers";
import roleRouter from "./role/role.router";
import rolesRouter from "./role/roles.router";
import { shopAdminRouter } from "./shop/routers/shop.admin.router";
import { shopsAdminRouter } from "./shop/routers/shops.admin.router";
import usersRouter from "./user/users.router";

const adminRouter = Router();

adminRouter.use("/category", categoryAdminRouter);
adminRouter.use("/discount", discountAdminRouter);
adminRouter.use("/discounts", discountsAdminRouter);
adminRouter.use("/role", roleRouter);
adminRouter.use("/roles", rolesRouter);
adminRouter.use("/shop", shopAdminRouter);
adminRouter.use("/shops", shopsAdminRouter);
adminRouter.use("/users", usersRouter);

export default adminRouter;
