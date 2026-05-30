import { uuid } from "@shared/schema";
import Joi from "joi";

import { CART_MAX_QUANTITY_PER_ITEM } from "./cart.constants";

const quantitySchema = Joi.number()
    .integer()
    .min(1)
    .max(CART_MAX_QUANTITY_PER_ITEM)
    .required();

export const addItemRequestSchema = Joi.object({
    quantity: quantitySchema,
    skuId: uuid.required(),
});

export const itemPathParamsSchema = Joi.object({
    skuId: uuid.required(),
});

export const updateItemRequestSchema = Joi.object({
    quantity: quantitySchema,
});
