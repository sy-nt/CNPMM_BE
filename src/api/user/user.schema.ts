import { limit, sort } from "@shared/schema";
import Joi from "joi";

export const getUsersRequestSchema = Joi.object({
    lastId: Joi.string().uuid().optional(),
    limit: limit,
    sort: sort,
});

export const userIdParamsSchema = Joi.object({
    id: Joi.string().uuid().required(),
});

export const updateUserRequestSchema = Joi.object({
    firstName: Joi.string().optional(),
    imageUrl: Joi.string().optional(),
    lastName: Joi.string().optional(),
    password: Joi.string().optional(),
}).min(1);
