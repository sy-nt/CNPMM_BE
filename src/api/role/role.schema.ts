import { limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    ROLE_ORDER_BY_FIELDS,
    ROLE_ORDER_BY_FIELDS_DEFAULT,
} from "./role.constants";

const permissionIdsArray = Joi.array().items(uuid).unique();

export const createRoleRequestSchema = Joi.object({
    description: Joi.string().required(),
    name: Joi.string().required(),
    permissionIds: permissionIdsArray.required(),
});

export const deleteRoleRequestParamsSchema = Joi.object({
    id: uuid.required(),
});

export const getRoleRequestParamsSchema = Joi.object({
    id: uuid.required(),
});

export const updateRoleRequestParamsSchema = Joi.object({
    id: uuid.required(),
});

export const updateRoleRequestBodySchema = Joi.object({
    description: Joi.string().optional(),
    name: Joi.string().optional(),
    permissionIds: permissionIdsArray.optional(),
});

export const getRolesRequestQuerySchema = Joi.object({
    limit,
    orderBy: Joi.string()
        .valid(...ROLE_ORDER_BY_FIELDS)
        .default(ROLE_ORDER_BY_FIELDS_DEFAULT),
    page,
    sort,
});
