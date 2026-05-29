export enum AuthError {
    INVALID_CREDENTIALS = "Invalid credentials",
    OTP_FAILED = "OTP failed",
    OTP_TOO_MANY_ATTEMPTS = "Too many OTP attempts, please request a new one",
    ROLE_NOT_FOUND = "Role not found",
    USER_ALREADY_EXISTS = "User already exists",
    USER_BLOCKED = "User is blocked",
    USER_LOGIN_BLOCKED = "User login is blocked for 5 minutes",
    USER_NOT_ACTIVE = "User not active",
    USER_NOT_FOUND = "User not found",
}

export enum RedisKeyPrefix {
    LOGIN_BLOCKED = "auth:login:blocked:",
    LOGIN_FAILED = "auth:login:failed:",
    OTP_ACTIVATE = "auth:otp:activate:",
    OTP_FAILED = "auth:otp:failed:",
    OTP_FORGOT_PASSWORD = "auth:otp:forgot-password:",
}

export const MAX_LOGIN_FAILED_ATTEMPTS = 5;

export const LOGIN_BLOCK_TTL_SECONDS = 60 * 5;

export const LOGIN_FAILED_WINDOW_SECONDS = 60 * 5;

export const OTP_TTL_SECONDS = 60 * 15;

export const MAX_OTP_FAILED_ATTEMPTS = 5;

export const OTP_MIN = 100000;

export const OTP_MAX_EXCLUSIVE = 1000000;
