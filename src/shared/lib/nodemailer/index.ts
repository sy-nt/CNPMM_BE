import config from "@config";
import { NodemailerConfig } from "@config/type";
import nodemailer, { Transporter } from "nodemailer";

export class Nodemailer {
    private readonly transporter: Transporter;

    constructor(private readonly config: NodemailerConfig) {
        this.transporter = nodemailer.createTransport({
            auth: {
                pass: this.config.password,
                user: this.config.email,
            },
            service: "gmail",
        });
    }

    sendActivationEmail(email: string, token: number) {
        const base64Token = Buffer.from(`${email}:${token}`).toString("base64");
        return this.sendEmail(
            "Wellcome to our app",
            `Your activation code is ${token}. Please use this code to activate your account. Or click the link below to activate your account: ${config.app.frontendUrl}/activate?token=${base64Token}`,
            email,
        );
    }

    sendForgotPasswordEmail(email: string, token: number) {
        const base64Token = Buffer.from(`${email}:${token}`).toString("base64");
        return this.sendEmail(
            "Forgot Password",
            `Your forgot password code is ${token}. Please use this code to reset your password. Or click the link below to reset your password: ${config.app.frontendUrl}/reset-password?token=${base64Token}`,
            email,
        );
    }

    sendLoginBlockedEmail(email: string) {
        return this.sendEmail(
            "Login Blocked",
            `Your login is blocked for 5 minutes because of too many failed attempts. Please try again later.`,
            email,
        );
    }

    private sendEmail(subject: string, text: string, to: string) {
        return this.transporter.sendMail({
            from: this.config.email,
            subject,
            text,
            to,
        });
    }
}

const appNodeMailer = new Nodemailer(config.nodemailer);
export default appNodeMailer;
