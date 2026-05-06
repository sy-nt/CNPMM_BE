import config from "@config";
import { requestContextStorage } from "@shared/lib/context";
import logger from "@shared/lib/logger";
import { NextFunction, Request, Response } from "express";
import lodash from "lodash";
import { v4 as uuidV4 } from "uuid";

export const requestTracker = (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    req.headers["x-request-id"] = req.headers["x-request-id"] ?? uuidV4();
    requestContextStorage.enterWith({
        requestId: req.headers["x-request-id"] as string,
    });

    const loggerFields = ["body", "params", "query"];
    if (config.nodeEnv === "DEV") {
        for (const field of loggerFields) {
            requestLogger(lodash.get(req, field), field);
        }
    }
    next();
};

const requestLogger = (reqField: null | object, fieldName: string) => {
    if (reqField && Object.keys(reqField).length > 0) {
        logger.debug({ field: fieldName, value: reqField });
    }
};
