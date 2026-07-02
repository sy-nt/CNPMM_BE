import { RequestContextService } from "@shared/lib/context";
import appLogger from "@shared/lib/logger";
import { NextFunction, Request, Response } from "express";
import { QueryRunner } from "typeorm";

export const transactionMiddleware = async (
    _req: Request,
    res: Response,
    next: NextFunction,
) => {
    const queryRunner = RequestContextService.getQueryRunner() as QueryRunner;
    const afterCommitCallbacks =
        RequestContextService.getContext().afterCommitCallbacks;
    let isCompleted = false;

    const cleanup = async () => {
        if (isCompleted) return;
        isCompleted = true;
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

        try {
            if (!queryRunner.isReleased) {
                if (isSuccess) {
                    await queryRunner.commitTransaction();
                } else {
                    await queryRunner.rollbackTransaction();
                }
            }
        } catch (error) {
            appLogger.error("Error rolling back transaction", error);
            await queryRunner.rollbackTransaction();
        } finally {
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }

        if (!isSuccess) return;
        for (const callback of afterCommitCallbacks) {
            try {
                await callback();
            } catch (error) {
                appLogger.error("After-commit callback failed", error);
            }
        }
    };

    res.on("finish", cleanup);
    res.on("close", cleanup);
    res.on("error", cleanup);

    next();
};
