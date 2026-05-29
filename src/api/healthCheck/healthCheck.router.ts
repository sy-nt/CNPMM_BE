import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { Router } from "express";

import healthCheckController from "./healthCheck.controller";

const healthCheckRouter = Router();

healthCheckRouter.get("/", asyncWrapper(healthCheckController.get));

export default healthCheckRouter;
