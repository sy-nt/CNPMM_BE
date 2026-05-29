import Joi from "joi";

import {
    ALLOWED_IMAGE_EXTENSIONS,
    IMAGE_PREFIXES,
    MAX_IMAGE_SIZE_BYTES_BY_PREFIX,
} from "./image.constants";

export const createPresignedUrlRequestSchema = Joi.object({
    extension: Joi.string()
        .lowercase()
        .valid(...ALLOWED_IMAGE_EXTENSIONS)
        .required(),
    prefix: Joi.string()
        .valid(...Object.values(IMAGE_PREFIXES))
        .required(),
    size: Joi.number()
        .integer()
        .greater(0)
        .required()
        .when("prefix", {
            switch: Object.entries(MAX_IMAGE_SIZE_BYTES_BY_PREFIX).map(
                ([prefix, max]) => ({
                    is: prefix,
                    then: Joi.number().max(max),
                }),
            ),
        }),
});
