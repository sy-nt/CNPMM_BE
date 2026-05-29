import { limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    PRODUCT_ORDER_BY_FIELDS,
    PRODUCT_ORDER_BY_FIELDS_DEFAULT,
} from "./product.constants";

const priceString = Joi.string()
    .pattern(/^\d{1,10}(\.\d{1,2})?$/)
    .messages({
        "string.pattern.base":
            "price must be a positive decimal with up to 2 decimal places",
    });

const skuSelectionItem = Joi.object({
    attributeIndex: Joi.number().integer().min(0).required(),
    valueIndex: Joi.number().integer().min(0).required(),
});

const skuSelectionByIdItem = Joi.object({
    attributeId: uuid.required(),
    valueId: uuid.required(),
});

const attributeValuePayload = Joi.object({
    displayOrder: Joi.number().integer().min(0).optional(),
    value: Joi.string().trim().min(1).max(64).required(),
});

const attributePayload = Joi.object({
    displayOrder: Joi.number().integer().min(0).optional(),
    name: Joi.string().trim().min(1).max(64).required(),
    values: Joi.array().items(attributeValuePayload).min(1).required(),
});

const skuPayload = Joi.object({
    imageKey: Joi.string().trim().min(1).max(255).optional(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
    price: priceString.optional(),
    selections: Joi.array().items(skuSelectionItem).min(1).required(),
    skuCode: Joi.string().trim().min(1).max(64).required(),
});

export const createProductRequestSchema = Joi.object({
    attributes: Joi.array().items(attributePayload).min(0).default([]),
    categoryId: uuid.required(),
    description: Joi.string().max(10000).optional(),
    isActive: Joi.boolean().optional(),
    mainImageKey: Joi.string().trim().min(1).max(255).optional(),
    name: Joi.string().trim().min(1).max(255).required(),
    price: priceString.required(),
    skus: Joi.array().items(skuPayload).min(1).required(),
});

export const updateProductRequestBodySchema = Joi.object({
    categoryId: uuid.optional(),
    description: Joi.string().max(10000).allow("").optional(),
    isActive: Joi.boolean().optional(),
    mainImageKey: Joi.string().trim().min(1).max(255).optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
    price: priceString.optional(),
}).min(1);

export const productIdParamsSchema = Joi.object({
    id: uuid.required(),
});

export const getProductsRequestQuerySchema = Joi.object({
    categoryId: uuid.optional(),
    isActive: Joi.boolean().optional().default(true),
    limit,
    orderBy: Joi.string()
        .valid(...PRODUCT_ORDER_BY_FIELDS)
        .default(PRODUCT_ORDER_BY_FIELDS_DEFAULT),
    page,
    search: Joi.string().trim().min(1).max(255).optional(),
    shopId: uuid.optional(),
    sort,
});

export const createSkuRequestSchema = Joi.object({
    imageKey: Joi.string().trim().min(1).max(255).optional(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
    price: priceString.optional(),
    selections: Joi.array().items(skuSelectionByIdItem).min(1).required(),
    skuCode: Joi.string().trim().min(1).max(64).required(),
});

export const updateSkuRequestBodySchema = Joi.object({
    expectedVersion: Joi.number().integer().min(1).optional(),
    imageKey: Joi.string().trim().min(1).max(255).optional(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
    price: priceString.optional(),
    skuCode: Joi.string().trim().min(1).max(64).optional(),
}).min(1);

export const setSkuSelectionsRequestSchema = Joi.object({
    selections: Joi.array().items(skuSelectionByIdItem).min(1).required(),
});

export const setSkuInventoryRequestSchema = Joi.object({
    quantity: Joi.number().integer().min(0).required(),
    warehouseId: uuid.required(),
});

export const createAttributeRequestSchema = Joi.object({
    displayOrder: Joi.number().integer().min(0).optional(),
    name: Joi.string().trim().min(1).max(64).required(),
    values: Joi.array().items(attributeValuePayload).min(1).required(),
});

export const updateAttributeRequestBodySchema = Joi.object({
    displayOrder: Joi.number().integer().min(0).optional(),
    name: Joi.string().trim().min(1).max(64).optional(),
}).min(1);

export const createAttributeValueRequestSchema = Joi.object({
    displayOrder: Joi.number().integer().min(0).optional(),
    value: Joi.string().trim().min(1).max(64).required(),
});

export const updateAttributeValueRequestBodySchema = Joi.object({
    displayOrder: Joi.number().integer().min(0).optional(),
    value: Joi.string().trim().min(1).max(64).optional(),
}).min(1);
