export type ActivateAccountRequestDto = {
    email: string;
    otp: number;
};

export type ForgotPasswordRequestDto = {
    email: string;
};

export type LoginRequestDto = {
    email: string;
    password: string;
};

export type LoginResponseDto = {
    accessToken: string;
    refreshToken: string;
};

export type LogoutRequestDto = {
    refreshToken: string;
};

export type RefreshTokenRequestDto = {
    refreshToken: string;
};

export type RefreshTokenResponseDto = {
    accessToken: string;
    refreshToken: string;
};

export type ResetPasswordRequestDto = {
    email: string;
    otp: number;
    password: string;
};

export type SignUpRequestDto = {
    email: string;
    firstName?: string;
    imageKey?: string;
    lastName?: string;
    password: string;
};
