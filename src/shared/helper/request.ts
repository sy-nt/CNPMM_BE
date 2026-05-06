import { Request } from "express";
import lodash from "lodash";

export const extractRequest = <T>(req: Request, field: string) => {
    return lodash.get(req, field) as T;
};
