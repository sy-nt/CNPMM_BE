import "reflect-metadata";
import config from "@config";
import logger from "@shared/lib/logger";
import { initNotificationWebSocket } from "@ws/notification";
import "@domain/seed";
import { createServer } from "http";

import app from "./app";

process.on("uncaughtException", (err) => {
    logger.error(err.stack!);
});

process.on("unhandledRejection", (reason, _) => {
    logger.error(reason as string);
});

const server = createServer(app);

initNotificationWebSocket(server).catch((error) => {
    logger.error("Failed to initialize notification WebSocket hub", error);
});

server.listen(config.port, () => {
    logger.info(`Server is running with ${config.nodeEnv} environment`);
    logger.info(`Server is running on port ${config.port}`);
});
