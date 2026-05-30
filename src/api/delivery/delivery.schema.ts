import { DeliveryStatus } from "@domain/entities";
import { limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    DELIVERY_ORDER_BY_FIELDS,
    DELIVERY_ORDER_BY_FIELDS_DEFAULT,
} from "./delivery.constants";

const feeString = Joi.string()
    .pattern(/^\d{1,10}(\.\d{1,2})?$/)
    .messages({
        "string.pattern.base":
            "fee must be a positive decimal with up to 2 decimal places",
    });

const quoteItem = Joi.object({
    quantity: Joi.number().integer().min(1).required(),
    skuId: uuid.required(),
});

export const createDeliveryMethodRequestSchema = Joi.object({
    code: Joi.string().trim().min(1).max(64).uppercase().required(),
    description: Joi.string().max(1000).optional(),
    etaMaxDays: Joi.number().integer().min(Joi.ref("etaMinDays")).required(),
    etaMinDays: Joi.number().integer().min(0).required(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).required(),
    providerCode: Joi.string().trim().min(1).max(64).optional(),
});

export const createDeliveryRateRequestSchema = Joi.object({
    baseFee: feeString.required(),
    deliveryMethodId: uuid.required(),
    deliveryZoneId: uuid.required(),
});

export const createDeliveryRequestSchema = Joi.object({
    deliveryMethodId: uuid.required(),
    destinationAddressId: uuid.required(),
    notes: Joi.string().max(1000).optional(),
    orderId: uuid.optional(),
    warehouseId: uuid.required(),
});

export const createDeliveryZoneRequestSchema = Joi.object({
    code: Joi.string().trim().min(1).max(64).uppercase().required(),
    description: Joi.string().max(1000).optional(),
    displayOrder: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).required(),
});

export const deliveryIdParamsSchema = Joi.object({
    id: uuid.required(),
});

export const getDeliveriesRequestQuerySchema = Joi.object({
    limit,
    orderBy: Joi.string()
        .valid(...DELIVERY_ORDER_BY_FIELDS)
        .default(DELIVERY_ORDER_BY_FIELDS_DEFAULT),
    page,
    sort,
    status: Joi.string()
        .valid(...Object.values(DeliveryStatus))
        .optional(),
});

export const getDeliveryRatesRequestQuerySchema = Joi.object({
    deliveryMethodId: uuid.optional(),
    deliveryZoneId: uuid.optional(),
    limit,
    orderBy: Joi.string().valid("createdAt").default("createdAt"),
    page,
    sort,
});

export const paginationRequestQuerySchema = Joi.object({
    limit,
    orderBy: Joi.string().valid("createdAt", "name").default("createdAt"),
    page,
    sort,
});

export const quoteDeliveryRequestSchema = Joi.object({
    addressId: uuid.required(),
    items: Joi.array().items(quoteItem).min(1).required(),
    warehouseId: uuid.required(),
});

export const updateDeliveryMethodRequestBodySchema = Joi.object({
    code: Joi.string().trim().min(1).max(64).uppercase().optional(),
    description: Joi.string().max(1000).optional(),
    etaMaxDays: Joi.number().integer().min(0).optional(),
    etaMinDays: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
    providerCode: Joi.string().trim().min(1).max(64).optional(),
})
    .custom((value, helpers) => {
        if (
            typeof value.etaMaxDays === "number" &&
            typeof value.etaMinDays === "number" &&
            value.etaMaxDays < value.etaMinDays
        ) {
            return helpers.error("any.invalid");
        }
        return value;
    }, "eta range")
    .messages({
        "any.invalid": "etaMaxDays must be >= etaMinDays",
    });

export const updateDeliveryRateRequestBodySchema = Joi.object({
    baseFee: feeString.optional(),
});

export const updateDeliveryStatusRequestBodySchema = Joi.object({
    notes: Joi.string().max(1000).optional(),
    status: Joi.string()
        .valid(...Object.values(DeliveryStatus))
        .required(),
    trackingCode: Joi.string().trim().min(1).max(128).optional(),
});

export const updateDeliveryZoneRequestBodySchema = Joi.object({
    code: Joi.string().trim().min(1).max(64).uppercase().optional(),
    description: Joi.string().max(1000).optional(),
    displayOrder: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
});
