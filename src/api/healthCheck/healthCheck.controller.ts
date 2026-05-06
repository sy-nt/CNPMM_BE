import { OkResponse } from "@shared/decorators/response";

import healthCheckService from "./healthCheck.service";

class HealthCheckController {
    @OkResponse()
    async get() {
        return healthCheckService.get();
    }
}

const healthCheckController = new HealthCheckController();
export default healthCheckController;
