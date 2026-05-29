import { uuid } from "@shared/schema";
import Joi from "joi";

export const createAddressRequestSchema = Joi.object({
    addressLine: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    district: Joi.string().required(),
    isPrimary: Joi.boolean().optional(),
    name: Joi.string().required(),
    state: Joi.string().required(),
});

export const deleteAddressRequestSchema = Joi.object({
    id: uuid.required(),
});

export const getAddressesRequestSchema = Joi.object({});

export const updateAddressRequestSchema = Joi.object({
    addressLine: Joi.string().optional(),
    city: Joi.string().optional(),
    country: Joi.string().optional(),
    district: Joi.string().optional(),
    id: uuid.required(),
    isPrimary: Joi.boolean().optional(),
    name: Joi.string().optional(),
    state: Joi.string().optional(),
});
