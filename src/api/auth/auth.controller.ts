import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    ActivateAccountRequestDto,
    ForgotPasswordRequestDto,
    LoginRequestDto,
    ResetPasswordRequestDto,
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
    async forgotPassword(req: Request) {
        const dto = extractRequest<ForgotPasswordRequestDto>(req, "body");
        return authService.forgotPassword(dto);
    }

    @OkResponse()
    async login(req: Request) {
        const dto = extractRequest<LoginRequestDto>(req, "body");
        return authService.login(dto);
    }

    @OkResponse()
    async logout() {
        const tokens = RequestContextService.getTokens();
        return authService.logout(tokens!.requestToken!);
    }

    @OkResponse()
    async refreshToken() {
        const jwtPayload = RequestContextService.getJwtPayload();
        const tokens = RequestContextService.getTokens();
        return authService.refreshToken(jwtPayload!, tokens!.requestToken!);
    }

    @OkResponse()
    async resetPassword(req: Request) {
        const dto = extractRequest<ResetPasswordRequestDto>(req, "body");
        return authService.resetPassword(dto);
    }

    @CreatedResponse()
    async signUp(req: Request) {
        const dto = extractRequest<SignUpRequestDto>(req, "body");
        return authService.signUp(dto);
    }

    @OkResponse()
    async status() {
        const jwtPayload = RequestContextService.getJwtPayload();
        return authService.authStatus(jwtPayload!.userId);
    }
}

export default new AuthController();
