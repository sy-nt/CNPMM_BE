import { limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    WAREHOUSE_ORDER_BY_FIELDS,
    WAREHOUSE_ORDER_BY_FIELDS_DEFAULT,
} from "./warehouse.constants";

export const createWarehouseRequestSchema = Joi.object({
    addressId: uuid.required(),
    code: Joi.string().trim().min(1).max(64).required(),
    isActive: Joi.boolean().optional(),
    isDefault: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).required(),
});

export const deleteWarehouseRequestParamsSchema = Joi.object({
    id: uuid.required(),
});

export const getWarehouseRequestParamsSchema = Joi.object({
    id: uuid.required(),
});

export const getWarehousesRequestQuerySchema = Joi.object({
    limit,
    orderBy: Joi.string()
        .valid(...WAREHOUSE_ORDER_BY_FIELDS)
        .default(WAREHOUSE_ORDER_BY_FIELDS_DEFAULT),
    page,
    sort,
});

export const updateWarehouseRequestBodySchema = Joi.object({
    addressId: uuid.optional(),
    code: Joi.string().trim().min(1).max(64).optional(),
    isActive: Joi.boolean().optional(),
    isDefault: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
});

export const updateWarehouseRequestParamsSchema = Joi.object({
    id: uuid.required(),
});
