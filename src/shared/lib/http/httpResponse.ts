import { Response } from "express";

import reasonPhrases from "./reasonPhrases";
import statusCodes from "./statusCodes";

export class HttpResponse {
    data: unknown;
    message: string;
    statusCode: number;

    constructor(
        data: unknown,
        message: string = reasonPhrases.OK,
        statusCode: number = statusCodes.OK,
    ) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    send(res: Response) {
        return res.status(this.statusCode).json(this);
    }
}

export class CreatedHttpResponse extends HttpResponse {
    constructor(
        data: unknown,
        message: string = reasonPhrases.CREATED,
        statusCode: number = statusCodes.CREATED,
    ) {
        super(data, message, statusCode);
    }
}

export class OkHttpResponse extends HttpResponse {}
