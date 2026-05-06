import config from "@config";
import { NodeEnv } from "@shared/types";
import util from "util";
import { createLogger, format, transports } from "winston";

import { RequestContext } from "../context";

const initDevFormat = () => {
    return format.printf((info) => {
        const { level, message, requestId, source, stack, timestamp, userId } =
            info;

        const formattedMessage =
            typeof message === "object"
                ? util.inspect(message, { colors: true, depth: null })
                : message;

        let messageString = `${level}: [${timestamp}]
Source: ${source}
Message: ${formattedMessage}
`;

        if (userId) {
            messageString += `User ID: ${userId}\n`;
        }

        if (requestId) {
            messageString += `Request ID: ${requestId}\n`;
        }

        if (stack) {
            messageString += `Stack: ${stack}\n`;
        }

        return messageString;
    });
};

const initProdFormat = () => {
    return format.json();
};

const initBaseFormat = () => {
    const formats = [
        format((info) => {
            const { context, error } = info;

            const result: Record<string, unknown> = {
                ...info,
            };

            if (context) {
                const { jwtPayload, requestId } = context as RequestContext;

                if (jwtPayload) {
                    result.userId = jwtPayload.userId;
                }

                if (requestId) {
                    result.requestId = requestId;
                }
            }

            if (error instanceof Error) {
                result.stack = (error.stack ?? "")
                    .split("\n")
                    .filter(
                        (line, index) =>
                            index === 0 || !line.includes("node_modules"),
                    )
                    .slice(0, 3)
                    .join("\n");
            }

            delete result.context;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return result as any;
        })(),
    ];

    return formats;
};

const initErrorStackFormat = () => {
    return [format.errors({ stack: true })];
};

const initLogger = (env: NodeEnv) => {
    const baseFormat = initBaseFormat();
    const errorFormat = initErrorStackFormat();

    const formats = [
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        ...errorFormat,
        ...baseFormat,
    ];

    if (env === "DEV") {
        formats.unshift(format.colorize());
        formats.push(initDevFormat());
    } else {
        formats.push(initProdFormat());
    }

    const logger = createLogger({
        level: env === "DEV" ? "debug" : "info",
        transports: [
            new transports.Console({
                format: format.combine(...formats),
            }),
        ],
    });

    return logger.child({
        source: "app",
    });
};

const appLogger = initLogger(config.nodeEnv);

export default appLogger;
