export enum AuthError {
    INVALID_CREDENTIALS = "Invalid credentials",
    OTP_FAILED = "OTP failed",
    ROLE_NOT_FOUND = "Role not found",
    USER_ALREADY_EXISTS = "User already exists",
    USER_BLOCKED = "User blocked for 5 minutes",
    USER_NOT_ACTIVE = "User not active",
}

export enum RedisKeyPrefix {
    LOGIN_BLOCKED = "auth:login:blocked:",
    LOGIN_FAILED = "auth:login:failed:",
    LOGOUT = "auth:logout:",
    OTP_ACTIVATE = "auth:otp:activate:",
    OTP_FAILED = "auth:otp:failed:",
}

export const MAX_LOGIN_FAILED_ATTEMPTS = 5;
