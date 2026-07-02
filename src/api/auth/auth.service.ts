import { IMAGE_PREFIXES } from "@api/image/image.constants";
import { claimImageKeys } from "@api/image/image.lifecycle";
import { UserEntity } from "@domain/entities";
import { GLOBAL_REDIS_KEY_PREFIX, REDIS_TRUTHY_VALUE } from "@shared/constants";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError, UnauthorizedError } from "@shared/lib/http/httpError";
import appJwt, { JwtPayload } from "@shared/lib/jwt";
import appNodeMailer from "@shared/lib/nodemailer";
import { RBAC_SYSTEM_ROLES } from "@shared/lib/rbac/rbac.constants";
import { hashPassword, verifyPassword } from "@shared/utils/password";
import { randomInt } from "crypto";
import ms from "ms";

import {
    AuthError,
    LOGIN_BLOCK_TTL_SECONDS,
    LOGIN_FAILED_WINDOW_SECONDS,
    MAX_LOGIN_FAILED_ATTEMPTS,
    MAX_OTP_FAILED_ATTEMPTS,
    OTP_MAX_EXCLUSIVE,
    OTP_MIN,
    OTP_TTL_SECONDS,
    RedisKeyPrefix,
} from "./auth.constants";
import {
    ActivateAccountRequestDto,
    ForgotPasswordRequestDto,
    LoginRequestDto,
    LoginResponseDto,
    RefreshTokenResponseDto,
    ResetPasswordRequestDto,
    SignUpRequestDto,
} from "./auth.dto";

export class AuthService extends BaseService {
    activateAccount = async (dto: ActivateAccountRequestDto): Promise<void> => {
        await this.verifyOtp(RedisKeyPrefix.OTP_ACTIVATE, dto.email, dto.otp);
        await this.repositories.user.update(
            { email: dto.email },
            { isActive: true },
        );
    };

    authStatus = async (userId: string) => {
        const user = await this.repositories.user.findOne({
            select: {
                email: true,
                isActive: true,
                isBlocked: true,
            },
            where: { id: userId },
        });
        if (!user) throw new UnauthorizedError(AuthError.USER_NOT_FOUND);
        const isLoginBlocked = await this.redis.get(
            `${RedisKeyPrefix.LOGIN_BLOCKED}:${user.email}`,
        );
        return {
            isActive: user.isActive,
            isBlocked: user.isBlocked,
            isLoginBlocked: Boolean(isLoginBlocked),
        };
    };

    forgotPassword = async (dto: ForgotPasswordRequestDto): Promise<void> => {
        const user = await this.repositories.user.findOne({
            where: {
                email: dto.email,
            },
        });
        if (!user) return;
        await this.sendForgotPasswordEmail(dto.email);
    };

    login = async (dto: LoginRequestDto): Promise<LoginResponseDto> => {
        const user = await this.repositories.user.findOne({
            where: {
                email: dto.email,
            },
        });

        if (!user) throw new UnauthorizedError(AuthError.INVALID_CREDENTIALS);
        this.validateUserStatus(user);

        const isPasswordValid = await verifyPassword(
            dto.password,
            user.password,
        );
        if (!isPasswordValid) await this.handleInvalidCredentials(dto.email);

        return appJwt.generateTokens({
            assignedShopId: user.assignedShopId ?? undefined,
            roleId: user.roleId,
            userId: user.id,
        });
    };

    logout = async (refreshToken: string): Promise<void> => {
        await this.blacklistRefreshToken(refreshToken);
    };

    refreshToken = async (
        jwtPayload: JwtPayload,
        oldRefreshToken: string,
    ): Promise<RefreshTokenResponseDto> => {
        await this.blacklistRefreshToken(oldRefreshToken);
        return appJwt.generateTokens({
            assignedShopId: jwtPayload.assignedShopId,
            roleId: jwtPayload.roleId,
            userId: jwtPayload.userId,
        });
    };

    resetPassword = async (dto: ResetPasswordRequestDto): Promise<void> => {
        await this.verifyOtp(
            RedisKeyPrefix.OTP_FORGOT_PASSWORD,
            dto.email,
            dto.otp,
        );
        const hashedPassword = await hashPassword(dto.password);
        await this.repositories.user.update(
            { email: dto.email },
            { password: hashedPassword },
        );
    };

    signUp = async (dto: SignUpRequestDto): Promise<void> => {
        const existingUser = await this.repositories.user.findOne({
            select: { id: true },
            where: { email: dto.email },
            withDeleted: true,
        });
        if (existingUser)
            throw new BadRequestError(AuthError.USER_ALREADY_EXISTS);

        const userRole = await this.repositories.role.findOne({
            where: {
                name: RBAC_SYSTEM_ROLES.USER,
            },
        });

        if (!userRole) throw new BadRequestError(AuthError.ROLE_NOT_FOUND);

        const hashedPassword = await hashPassword(dto.password);
        if (dto.imageKey) {
            await claimImageKeys(
                {
                    image: this.repositories.image,
                    shop: this.repositories.shop,
                    sku: this.repositories.sku,
                    spu: this.repositories.spu,
                    user: this.repositories.user,
                },
                [dto.imageKey],
                IMAGE_PREFIXES.USER_AVATAR,
            );
        }
        await this.repositories.user.create({
            email: dto.email,
            firstName: dto.firstName,
            imageKey: dto.imageKey,
            lastName: dto.lastName,
            password: hashedPassword,
            roleId: userRole.id,
        });
        await this.sendActivationEmail(dto.email);
    };

    private blacklistRefreshToken = async (
        refreshToken: string,
    ): Promise<void> => {
        await this.redis.setex(
            `${GLOBAL_REDIS_KEY_PREFIX.AUTH_LOGOUT}:${refreshToken}`,
            ms(this.config.auth.jwt.refreshTokenExpiresIn) / 1000,
            REDIS_TRUTHY_VALUE,
        );
    };

    private handleInvalidCredentials = async (email: string) => {
        const failedAttemptsKey = `${RedisKeyPrefix.LOGIN_FAILED}:${email}`;
        const failedAttempts = await this.redis.incr(failedAttemptsKey);
        if (failedAttempts === 1) {
            await this.redis.expire(
                failedAttemptsKey,
                LOGIN_FAILED_WINDOW_SECONDS,
            );
        } else if (failedAttempts >= MAX_LOGIN_FAILED_ATTEMPTS) {
            await this.redis.setex(
                `${RedisKeyPrefix.LOGIN_BLOCKED}:${email}`,
                LOGIN_BLOCK_TTL_SECONDS,
                REDIS_TRUTHY_VALUE,
            );
            appNodeMailer.sendLoginBlockedEmail(email);
            throw new UnauthorizedError(AuthError.USER_LOGIN_BLOCKED);
        }
        throw new UnauthorizedError(AuthError.INVALID_CREDENTIALS);
    };

    private sendActivationEmail = async (email: string) => {
        const tokenOTP = randomInt(OTP_MIN, OTP_MAX_EXCLUSIVE);
        await this.redis.setex(
            `${RedisKeyPrefix.OTP_ACTIVATE}:${email}`,
            OTP_TTL_SECONDS,
            tokenOTP,
        );

        appNodeMailer.sendActivationEmail(email, tokenOTP);
    };

    private sendForgotPasswordEmail = async (email: string) => {
        const tokenOTP = randomInt(OTP_MIN, OTP_MAX_EXCLUSIVE);
        await this.redis.setex(
            `${RedisKeyPrefix.OTP_FORGOT_PASSWORD}:${email}`,
            OTP_TTL_SECONDS,
            tokenOTP,
        );

        appNodeMailer.sendForgotPasswordEmail(email, tokenOTP);
    };

    private async validateUserStatus(user: UserEntity): Promise<void> {
        if (user.isBlocked) throw new UnauthorizedError(AuthError.USER_BLOCKED);
        if (!user.isActive)
            throw new UnauthorizedError(AuthError.USER_NOT_ACTIVE);
        const isLoginBlocked = await this.redis.get(
            `${RedisKeyPrefix.LOGIN_BLOCKED}:${user.email}`,
        );
        if (isLoginBlocked)
            throw new UnauthorizedError(AuthError.USER_LOGIN_BLOCKED);
    }

    private verifyOtp = async (
        purpose: RedisKeyPrefix,
        email: string,
        providedOtp: number,
    ): Promise<void> => {
        const otpKey = `${purpose}:${email}`;
        const attemptsKey = `${RedisKeyPrefix.OTP_FAILED}:${purpose}:${email}`;
        const otp = await this.redis.get(otpKey);
        if (!otp) {
            throw new UnauthorizedError(AuthError.OTP_FAILED);
        }
        if (otp !== providedOtp.toString()) {
            const attempts = await this.redis.incr(attemptsKey);
            if (attempts === 1) {
                await this.redis.expire(attemptsKey, OTP_TTL_SECONDS);
            }
            if (attempts >= MAX_OTP_FAILED_ATTEMPTS) {
                await this.redis.del(otpKey, attemptsKey);
                throw new UnauthorizedError(AuthError.OTP_TOO_MANY_ATTEMPTS);
            }
            throw new UnauthorizedError(AuthError.OTP_FAILED);
        }
        await this.redis.del(otpKey, attemptsKey);
    };
}

export default new AuthService();
