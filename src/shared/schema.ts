import Joi from "joi";

export const page = Joi.number().min(1).default(1);
export const limit = Joi.number().min(5).max(100).default(30);
export const sort = Joi.string()
    .valid("desc", "asc", "DESC", "ASC")
    .default("desc");

export const uuid = Joi.string().uuid();

export const positiveNumber = Joi.number().greater(0).default(1);
export const negativeNumber = Joi.number().less(0).default(-1);

export const email = Joi.string().email();
export const strongPassword = Joi.string().pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
);
