import { Logger } from "winston";

import appLogger from "../logger";

export abstract class Base {
    protected readonly logger: Logger;

    constructor() {
        this.logger = appLogger.child({
            source: this.constructor.name,
        });
    }
}
