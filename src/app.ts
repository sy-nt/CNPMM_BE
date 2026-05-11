import router from "@api/app.router";
import { appRateLimit } from "@shared/lib/rateLimit";
import { handleError, handleNotFound } from "@shared/middlewares/errorHandler";
import { requestTracker } from "@shared/middlewares/requestTracker";
import cors from "cors";
import "@domain/db";
import express, { ErrorRequestHandler } from "express";
import morgan from "morgan";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestTracker);

morgan.token("request-time", () => {
    return new Date().toISOString();
});

app.use(appRateLimit);
app.use(
    morgan(
        ":request-time :method :url :status :res[content-length] - :response-time ms",
    ),
);

app.use("/api", router);
app.use(handleNotFound);

app.use(handleError as unknown as ErrorRequestHandler);

export default app;
