import { CART_MAX_QUANTITY_PER_ITEM } from "@api/cart/cart.constants";
import { OrderStatus } from "@domain/entities";
import { limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    ORDER_ORDER_BY_FIELDS,
    ORDER_ORDER_BY_FIELDS_DEFAULT,
} from "./order.constants";

const checkoutItemSchema = Joi.object({
    quantity: Joi.number()
        .integer()
        .min(1)
        .max(CART_MAX_QUANTITY_PER_ITEM)
        .optional(),
    skuId: uuid.required(),
});

const decimalString = Joi.string()
    .pattern(/^\d{1,10}(\.\d{1,2})?$/)
    .messages({
        "string.pattern.base":
            "amount must be a non-negative decimal with up to 2 decimal places",
    });

const updatableStatuses = Object.values(OrderStatus).filter(
    (status) => status !== OrderStatus.CANCELLED,
);

export const cancelOrderRequestBodySchema = Joi.object({
    reason: Joi.string()
        .trim()
        .max(255)
        .pattern(/[<>]/, { invert: true })
        .messages({
            "string.pattern.invert.base":
                "reason cannot contain HTML tag characters",
        })
        .optional(),
});

export const checkoutPreviewRequestSchema = Joi.object({
    claimedDiscountIds: Joi.array().items(uuid.required()).unique().optional(),
    deliveryMethodId: uuid.required(),
    destinationAddressId: uuid.required(),
    items: Joi.array()
        .items(checkoutItemSchema)
        .min(1)
        .unique((a, b) => a.skuId === b.skuId)
        .required(),
});

export const getOrdersRequestQuerySchema = Joi.object({
    limit,
    orderBy: Joi.string()
        .valid(...ORDER_ORDER_BY_FIELDS)
        .default(ORDER_ORDER_BY_FIELDS_DEFAULT),
    page,
    shopId: uuid.optional(),
    sort,
    status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .optional(),
});

export const orderIdParamsSchema = Joi.object({
    id: uuid.required(),
});

export const placeOrderRequestSchema = Joi.object({
    claimedDiscountIds: Joi.array().items(uuid.required()).unique().optional(),
    deliveryMethodId: uuid.required(),
    destinationAddressId: uuid.required(),
    expectedTotalAmount: decimalString.required(),
    items: Joi.array()
        .items(checkoutItemSchema)
        .min(1)
        .unique((a, b) => a.skuId === b.skuId)
        .required(),
});

export const updateOrderStatusRequestBodySchema = Joi.object({
    status: Joi.string()
        .valid(...updatableStatuses)
        .required(),
});
