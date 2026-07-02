import Joi from "joi";

import {
    ALLOWED_IMAGE_EXTENSIONS,
    IMAGE_PREFIXES,
    MAX_IMAGE_SIZE_BYTES_BY_PREFIX,
} from "./image.constants";

const extensionField = Joi.string()
    .lowercase()
    .valid(...ALLOWED_IMAGE_EXTENSIONS)
    .required();

const sizeFieldForPrefix = (
    prefix: keyof typeof MAX_IMAGE_SIZE_BYTES_BY_PREFIX,
) =>
    Joi.number()
        .integer()
        .greater(0)
        .max(MAX_IMAGE_SIZE_BYTES_BY_PREFIX[prefix])
        .required();

export const createPublicPresignedUrlRequestSchema = Joi.object({
    extension: extensionField,
    prefix: Joi.string().valid(IMAGE_PREFIXES.USER_AVATAR).required(),
    size: sizeFieldForPrefix(IMAGE_PREFIXES.USER_AVATAR),
});

export const createShopPresignedUrlRequestSchema = Joi.object({
    extension: extensionField,
    prefix: Joi.string()
        .valid(IMAGE_PREFIXES.PRODUCT_IMAGE, IMAGE_PREFIXES.SHOP_LOGO)
        .required(),
    size: Joi.when("prefix", {
        switch: [
            {
                is: IMAGE_PREFIXES.PRODUCT_IMAGE,
                then: sizeFieldForPrefix(IMAGE_PREFIXES.PRODUCT_IMAGE),
            },
            {
                is: IMAGE_PREFIXES.SHOP_LOGO,
                then: sizeFieldForPrefix(IMAGE_PREFIXES.SHOP_LOGO),
            },
        ],
    }),
});
