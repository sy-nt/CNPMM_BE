import { createAddressRequestSchema } from "@api/address/address.schema";
import { ShopStatus } from "@domain/entities/shop.entity";
import { email, limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    SHOP_ORDER_BY_FIELDS,
    SHOP_ORDER_BY_FIELDS_DEFAULT,
} from "./shop.constants";

export const assignWorkerRequestSchema = Joi.object({
    email: email.required(),
});

export const unassignWorkerRequestSchema = assignWorkerRequestSchema;

export const createShopRequestSchema = Joi.object({
    addresses: Joi.array().items(createAddressRequestSchema).required(),
    description: Joi.string().optional(),
    imageKey: Joi.string().trim().min(1).max(255).optional(),
    name: Joi.string().required(),
});

export const updateShopRequestSchema = Joi.object({
    addresses: Joi.array().items(createAddressRequestSchema).optional(),
    description: Joi.string().optional(),
    imageKey: Joi.string().trim().min(1).max(255).optional(),
    name: Joi.string().optional(),
});

export const adminGetShopsRequestSchema = Joi.object({
    limit: limit,
    orderBy: Joi.string()
        .valid(...SHOP_ORDER_BY_FIELDS)
        .default(SHOP_ORDER_BY_FIELDS_DEFAULT),
    page: page,
    sort: sort,
    status: Joi.string()
        .valid(...Object.values(ShopStatus))
        .optional(),
});

export const getShopsRequestSchema = Joi.object({
    limit: limit,
    orderBy: Joi.string()
        .valid(...SHOP_ORDER_BY_FIELDS)
        .default(SHOP_ORDER_BY_FIELDS_DEFAULT),
    page: page,
    sort: sort,
});

export const updateShopStatusRequestSchema = Joi.object({
    id: uuid.required(),
    status: Joi.string()
        .valid(...Object.values(ShopStatus))
        .required(),
});

export const getShopRequestParamsSchema = Joi.object({
    idOrSlug: Joi.string().required(),
});
