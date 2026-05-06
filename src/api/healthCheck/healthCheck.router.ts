import { asyncWrapper } from "@shared/helper/asyncWrapper";
import { Router } from "express";

import healthCheckController from "./healthCheck.controller";

export default function setUpHealthCheckRouter(router: Router) {
    const PREFIX = "/health_check";

    router.get(`${PREFIX}/`, asyncWrapper(healthCheckController.get));
}
