import config from "@config";
import logger from "@shared/lib/logger";
import { NextFunction, Request, Response } from "express";
import lodash from "lodash";

export const requestTracker = (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
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
