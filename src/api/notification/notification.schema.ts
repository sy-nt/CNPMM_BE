import { limit, sort, uuid } from "@shared/schema";
import Joi from "joi";

export const getNotificationsRequestSchema = Joi.object({
    lastId: uuid.optional(),
    limit,
    sort,
    unreadOnly: Joi.boolean().optional(),
});

export const markNotificationParamsSchema = Joi.object({
    id: uuid.required(),
});
