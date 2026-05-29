import { email, strongPassword } from "@shared/schema";
import Joi from "joi";

export const loginRequestSchema = Joi.object({
    email: email.required(),
    password: strongPassword.required(),
});

export const signUpRequestSchema = Joi.object({
    email: email.required(),
    firstName: Joi.string().optional(),
    imageUrl: Joi.string().uri().optional(),
    lastName: Joi.string().optional(),
    password: strongPassword.required(),
});

export const activateAccountRequestSchema = Joi.object({
    email: email.required(),
    otp: Joi.number().required(),
});

export const forgotPasswordRequestSchema = Joi.object({
    email: email.required(),
});

export const resetPasswordRequestSchema = Joi.object({
    email: email.required(),
    otp: Joi.number().required(),
    password: strongPassword.required(),
});
