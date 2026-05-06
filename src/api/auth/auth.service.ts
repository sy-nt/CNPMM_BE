import config from "@config";
import AppDataSource from "@domain/db/mysql";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError, UnauthorizedError } from "@shared/lib/http/httpError";
import appJwt, { JwtPayload } from "@shared/lib/jwt";
import appNodeMailer from "@shared/lib/nodemailer";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import ms from "ms";

import {
    AuthError,
    MAX_LOGIN_FAILED_ATTEMPTS,
    RedisKeyPrefix,
} from "./auth.constants";
import {
    ActivateAccountRequestDto,
    LoginRequestDto,
    LoginResponseDto,
    RefreshTokenResponseDto,
    SignUpRequestDto,
} from "./auth.dto";

export class AuthService extends BaseService {
    activateAccount = async (dto: ActivateAccountRequestDto): Promise<void> => {
        const otpKey = `${RedisKeyPrefix.OTP_ACTIVATE}:${dto.email}`;
        const otp = await this.redis.get(otpKey);
        if (otp !== dto.otp.toString())
            throw new UnauthorizedError(AuthError.OTP_FAILED);

        await AppDataSource.transaction(async (manager) => {
            await this.repositories.user.update(
                manager,
                { email: dto.email },
                {
                    isActive: true,
                },
            );
        });

        await this.redis.del(otpKey);
    };

    login = async (dto: LoginRequestDto): Promise<LoginResponseDto> => {
        const user = await this.repositories.user.findOne({
            where: {
                email: dto.email,
            },
        });

        if (!user) throw new UnauthorizedError(AuthError.INVALID_CREDENTIALS);
        if (!user.isActive)
            throw new UnauthorizedError(AuthError.USER_NOT_ACTIVE);

        await this.requireUnblockedUser(dto.email);
        const isPasswordValid = await bcrypt.compare(
            dto.password,
            user.password,
        );
        if (!isPasswordValid) await this.handleInvalidCredentials(dto.email);

        return appJwt.generateTokens({
            userId: user.id,
        });
    };

    logout = async (refreshToken: string): Promise<void> => {
        const expireTime = ms(config.auth.jwt.refreshTokenExpiresIn) / 1000;
        await this.redis.setex(
            `${RedisKeyPrefix.LOGOUT}:${refreshToken}`,
            expireTime,
            "1",
        );
    };

    refreshToken = async (
        jwtPayload: JwtPayload,
    ): Promise<RefreshTokenResponseDto> => {
        return appJwt.generateTokens({
            userId: jwtPayload.userId,
        });
    };

    signUp = async (dto: SignUpRequestDto): Promise<void> => {
        const existingUser = await this.repositories.user.findOne({
            where: {
                email: dto.email,
            },
        });
        if (existingUser)
            throw new BadRequestError(AuthError.USER_ALREADY_EXISTS);

        const userRole = await this.repositories.role.findOne({
            where: {
                name: "user",
            },
        });

        if (!userRole) throw new BadRequestError(AuthError.ROLE_NOT_FOUND);

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        await AppDataSource.transaction(async (manager) => {
            return this.repositories.user.create(manager, {
                email: dto.email,
                firstName: dto.firstName,
                imageUrl: dto.imageUrl,
                lastName: dto.lastName,
                password: hashedPassword,
                roles: [userRole],
            });
        });
        await this.sendActivationEmail(dto.email);
    };

    private handleInvalidCredentials = async (email: string) => {
        const failedAttemptsKey = `${RedisKeyPrefix.LOGIN_FAILED}:${email}`;
        const failedAttempts = await this.redis.incr(failedAttemptsKey);
        if (failedAttempts === 1) {
            await this.redis.expire(failedAttemptsKey, 60 * 5); // 5 minutes
        } else if (failedAttempts > MAX_LOGIN_FAILED_ATTEMPTS) {
            await this.redis.setex(
                `${RedisKeyPrefix.LOGIN_BLOCKED}:${email}`,
                60 * 5,
                "1",
            ); // 5 minutes
            throw new UnauthorizedError(AuthError.USER_BLOCKED);
        }
        throw new UnauthorizedError(AuthError.INVALID_CREDENTIALS);
    };

    private requireUnblockedUser = async (email: string) => {
        const blockedKey = `${RedisKeyPrefix.LOGIN_BLOCKED}:${email}`;
        const isBlocked = await this.redis.get(blockedKey);
        if (isBlocked) throw new UnauthorizedError(AuthError.USER_BLOCKED);
    };

    private sendActivationEmail = async (email: string) => {
        const tokenOTP = randomInt(100000, 1000000);
        await this.redis.setex(
            `${RedisKeyPrefix.OTP_ACTIVATE}:${email}`,
            60 * 5,
            tokenOTP.toString(),
        );
        appNodeMailer.sendEmail(
            "Wellcome to our app",
            `Your activation code is ${tokenOTP}. Please use this code to activate your account.`,
            email,
        );
    };
}

export default new AuthService();
