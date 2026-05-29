import { limit, page, sort, uuid } from "@shared/schema";
import Joi from "joi";

import {
    CATEGORY_MAX_DEPTH,
    CATEGORY_ORDER_BY_FIELDS,
    CATEGORY_ORDER_BY_FIELDS_DEFAULT,
} from "./category.constants";

export const createCategoryRequestSchema = Joi.object({
    description: Joi.string().optional(),
    displayOrder: Joi.number().integer().min(0).optional(),
    iconUrl: Joi.string().uri().optional(),
    name: Joi.string().required(),
    parentId: uuid.optional(),
});

export const deleteCategoryRequestParamsSchema = Joi.object({
    id: uuid.required(),
});

export const getCategoryTreeRequestParamsSchema = Joi.object({
    id: uuid.required(),
});

export const getCategoryTreeRequestQuerySchema = Joi.object({
    depth: Joi.number()
        .integer()
        .min(1)
        .max(CATEGORY_MAX_DEPTH)
        .default(CATEGORY_MAX_DEPTH),
});

export const getSystemCategoriesRequestQuerySchema = Joi.object({
    limit,
    orderBy: Joi.string()
        .valid(...CATEGORY_ORDER_BY_FIELDS)
        .default(CATEGORY_ORDER_BY_FIELDS_DEFAULT),
    page,
    sort,
});

export const updateCategoryRequestBodySchema = Joi.object({
    description: Joi.string().optional(),
    displayOrder: Joi.number().integer().min(0).optional(),
    iconUrl: Joi.string().uri().optional(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().optional(),
});

export const updateCategoryRequestParamsSchema = Joi.object({
    id: uuid.required(),
});
