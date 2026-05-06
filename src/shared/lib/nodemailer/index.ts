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

    sendEmail(subject: string, text: string, to: string) {
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
