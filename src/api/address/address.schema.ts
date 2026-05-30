import { uuid } from "@shared/schema";
import Joi from "joi";

const latitudeString = Joi.string()
    .pattern(/^-?(?:90(?:\.0{1,7})?|(?:[0-8]?\d)(?:\.\d{1,7})?)$/)
    .messages({
        "string.pattern.base":
            "latitude must be a decimal between -90 and 90 with up to 7 decimal places",
    });

const longitudeString = Joi.string()
    .pattern(/^-?(?:180(?:\.0{1,7})?|(?:1[0-7]\d|[0-9]?\d)(?:\.\d{1,7})?)$/)
    .messages({
        "string.pattern.base":
            "longitude must be a decimal between -180 and 180 with up to 7 decimal places",
    });

export const addressIdParamsSchema = Joi.object({
    id: uuid.required(),
});

export const createAddressRequestSchema = Joi.object({
    addressLine: Joi.string().trim().max(255).required(),
    city: Joi.string().trim().max(255).required(),
    country: Joi.string().trim().max(255).required(),
    district: Joi.string().trim().max(255).required(),
    isPrimary: Joi.boolean().optional(),
    latitude: latitudeString.optional(),
    longitude: longitudeString.optional(),
    name: Joi.string().trim().max(255).required(),
    state: Joi.string().trim().max(255).required(),
});

export const updateAddressRequestBodySchema = Joi.object({
    addressLine: Joi.string().trim().max(255).optional(),
    city: Joi.string().trim().max(255).optional(),
    country: Joi.string().trim().max(255).optional(),
    district: Joi.string().trim().max(255).optional(),
    isPrimary: Joi.boolean().optional(),
    latitude: latitudeString.optional(),
    longitude: longitudeString.optional(),
    name: Joi.string().trim().max(255).optional(),
    state: Joi.string().trim().max(255).optional(),
});
