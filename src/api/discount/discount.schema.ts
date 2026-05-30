import {
    DiscountScope,
    DiscountType,
    DiscountValueType,
} from "@domain/entities";
import { limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    DISCOUNT_ORDER_BY_FIELDS,
    DISCOUNT_ORDER_BY_FIELDS_DEFAULT,
    DiscountRuleType,
} from "./discount.constants";

const decimalString = Joi.string()
    .pattern(/^\d{1,10}(\.\d{1,2})?$/)
    .messages({
        "string.pattern.base":
            "value must be a non-negative decimal with up to 2 decimal places",
    });

const ruleParamsSchema = Joi.alternatives().conditional("..0.type", {
    switch: [
        {
            is: DiscountRuleType.MIN_ITEM_COUNT,
            then: Joi.object({
                count: Joi.number().integer().min(1).required(),
            }),
        },
        {
            is: DiscountRuleType.MIN_SUBTOTAL,
            then: Joi.object({ amount: decimalString.required() }),
        },
    ],
});

const discountRuleSchema = Joi.object({
    params: ruleParamsSchema.required(),
    type: Joi.string()
        .valid(...Object.values(DiscountRuleType))
        .required(),
});

const rulesSchema = Joi.array()
    .items(discountRuleSchema)
    .unique((a: { type: string }, b: { type: string }) => a.type === b.type)
    .default([]);

const targetSpuIdsSchema = Joi.array().items(uuid.required()).unique();

const valueWithPercentageCap = decimalString
    .custom((value, helpers) => {
        const parent = helpers.state.ancestors[0] as {
            valueType?: DiscountValueType;
        };
        if (
            parent?.valueType === DiscountValueType.PERCENTAGE &&
            Number(value) > 100
        ) {
            return helpers.error("any.invalid");
        }
        return value;
    }, "percentage upper bound")
    .messages({
        "any.invalid": "value must be <= 100 when valueType is percentage",
    });

const baseDiscountFields = {
    code: Joi.string().trim().min(1).max(64).uppercase().optional(),
    description: Joi.string().max(1000).optional(),
    isActive: Joi.boolean().optional(),
    maxDiscountAmount: decimalString.optional(),
    maxUses: Joi.number().integer().min(1).optional(),
    maxUsesPerUser: Joi.number().integer().min(1).optional(),
    name: Joi.string().trim().min(1).max(255).required(),
    rules: rulesSchema,
    validFrom: Joi.date().optional(),
    validUntil: Joi.date().greater(Joi.ref("validFrom")).optional(),
    value: valueWithPercentageCap.required(),
    valueType: Joi.string()
        .valid(...Object.values(DiscountValueType))
        .required(),
};

export const createGlobalDiscountRequestSchema = Joi.object({
    ...baseDiscountFields,
    discountType: Joi.string()
        .valid(...Object.values(DiscountType))
        .required(),
    scope: Joi.string()
        .valid(...Object.values(DiscountScope))
        .required(),
    shopId: Joi.when("scope", {
        is: DiscountScope.SHOP,
        otherwise: Joi.forbidden(),
        then: uuid.required(),
    }),
    targetSpuIds: Joi.when("scope", {
        is: DiscountScope.SHOP,
        otherwise: Joi.forbidden(),
        then: targetSpuIdsSchema.optional(),
    }),
}).when(Joi.object({ scope: DiscountScope.SHOP }).unknown(), {
    then: Joi.object({
        discountType: Joi.valid(DiscountType.ITEMS).required(),
    }),
});

export const createShopDiscountRequestSchema = Joi.object({
    ...baseDiscountFields,
    targetSpuIds: targetSpuIdsSchema.optional(),
});

export const discountIdParamsSchema = Joi.object({
    id: uuid.required(),
});

export const getDiscountsRequestQuerySchema = Joi.object({
    code: Joi.string().trim().min(1).max(64).uppercase().optional(),
    discountType: Joi.string()
        .valid(...Object.values(DiscountType))
        .optional(),
    isActive: Joi.boolean().optional(),
    limit,
    orderBy: Joi.string()
        .valid(...DISCOUNT_ORDER_BY_FIELDS)
        .default(DISCOUNT_ORDER_BY_FIELDS_DEFAULT),
    page,
    scope: Joi.string()
        .valid(...Object.values(DiscountScope))
        .optional(),
    sort,
});

export const getShopDiscountsRequestQuerySchema = Joi.object({
    code: Joi.string().trim().min(1).max(64).uppercase().optional(),
    isActive: Joi.boolean().optional(),
    limit,
    orderBy: Joi.string()
        .valid(...DISCOUNT_ORDER_BY_FIELDS)
        .default(DISCOUNT_ORDER_BY_FIELDS_DEFAULT),
    page,
    sort,
});

export const updateDiscountRequestBodySchema = Joi.object({
    code: Joi.string().trim().min(1).max(64).uppercase().allow(null).optional(),
    description: Joi.string().max(1000).allow(null).optional(),
    isActive: Joi.boolean().optional(),
    maxDiscountAmount: decimalString.allow(null).optional(),
    maxUses: Joi.number().integer().min(1).allow(null).optional(),
    maxUsesPerUser: Joi.number().integer().min(1).allow(null).optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
    rules: rulesSchema.optional(),
    targetSpuIds: targetSpuIdsSchema.optional(),
    validFrom: Joi.date().allow(null).optional(),
    validUntil: Joi.date().allow(null).optional(),
    value: valueWithPercentageCap.optional(),
    valueType: Joi.string()
        .valid(...Object.values(DiscountValueType))
        .optional(),
});
