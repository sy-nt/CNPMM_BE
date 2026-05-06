import { BaseService } from "@shared/lib/base/service";

class HealthCheckService extends BaseService {
    get = () => {
        return {
            message: "Hello World",
        };
    };
}

const healthCheckService = new HealthCheckService();
export default healthCheckService;
