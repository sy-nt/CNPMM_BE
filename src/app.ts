import router from "@api/app.router";
import { appRateLimit } from "@shared/lib/rateLimit";
import { contextMiddleware } from "@shared/middlewares/ctx";
import { handleError, handleNotFound } from "@shared/middlewares/errorHandler";
import { requestTracker } from "@shared/middlewares/requestTracker";
import { transactionMiddleware } from "@shared/middlewares/transaction";
import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import morgan from "morgan";
import "@domain/db";
import "@schedulers";

const app = express();

app.use(cors());
app.use(express.json());
app.use(contextMiddleware);
app.use(transactionMiddleware);
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

app.use("/api/v1", router);
app.use(handleNotFound);

app.use(handleError as unknown as ErrorRequestHandler);

export default app;
