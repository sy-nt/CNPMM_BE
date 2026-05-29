import { limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    INVENTORY_ORDER_BY_FIELDS,
    INVENTORY_ORDER_BY_FIELDS_DEFAULT,
} from "./inventory.constants";

export const adjustInventoryRequestBodySchema = Joi.object({
    delta: Joi.number()
        .integer()
        .invalid(0)
        .required()
        .messages({ "any.invalid": "delta must be non-zero" }),
    expectedVersion: Joi.number().integer().min(1).optional(),
});

export const inventoryKeyParamsSchema = Joi.object({
    skuId: uuid.required(),
    warehouseId: uuid.required(),
});

export const inventorySkuParamsSchema = Joi.object({
    skuId: uuid.required(),
});

export const inventoryWarehouseParamsSchema = Joi.object({
    warehouseId: uuid.required(),
});

export const inventoryWarehouseQuerySchema = Joi.object({
    limit,
    orderBy: Joi.string()
        .valid(...INVENTORY_ORDER_BY_FIELDS)
        .default(INVENTORY_ORDER_BY_FIELDS_DEFAULT),
    page,
    sort,
});

export const setInventoryRequestBodySchema = Joi.object({
    quantity: Joi.number().integer().min(0).required(),
});
