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
    let isCompleted = false;

    const cleanup = async () => {
        if (isCompleted) return;
        isCompleted = true;

        try {
            if (!queryRunner.isReleased) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
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
    };

    res.on("finish", cleanup);
    res.on("close", cleanup);
    res.on("error", cleanup);

    next();
};
