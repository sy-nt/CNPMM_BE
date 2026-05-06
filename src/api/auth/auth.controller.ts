import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { extractContext } from "@shared/lib/context";
import { Request } from "express";

import {
    ActivateAccountRequestDto,
    LoginRequestDto,
    SignUpRequestDto,
} from "./auth.dto";
import authService from "./auth.service";

export class AuthController {
    @OkResponse()
    async activateAccount(req: Request) {
        const dto = extractRequest<ActivateAccountRequestDto>(req, "body");
        return authService.activateAccount(dto);
    }

    @OkResponse()
    async login(req: Request) {
        const dto = extractRequest<LoginRequestDto>(req, "body");
        return authService.login(dto);
    }

    @OkResponse()
    async logout() {
        const context = extractContext();
        return authService.logout(context.requestToken!);
    }

    @OkResponse()
    async refreshToken() {
        const context = extractContext();
        return authService.refreshToken(context.jwtPayload!);
    }

    @CreatedResponse()
    async signUp(req: Request) {
        const dto = extractRequest<SignUpRequestDto>(req, "body");
        return authService.signUp(dto);
    }
}

export default new AuthController();
