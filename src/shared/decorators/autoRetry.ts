import logger from "@shared/lib/logger";
import { sleep } from "@shared/utils/sleep";

export function AutoRetry(
    retryTimes: number = 5,
    sleepTime: null | number = null, // Millisecond
) {
    return function (
        _target: unknown,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: unknown[]) {
            do {
                try {
                    return await originalMethod.apply(this, args);
                } catch (error) {
                    logger.info(
                        `${propertyKey} auto retry times left: ${retryTimes}`,
                    );
                    retryTimes -= 1;
                    if (sleepTime) await sleep(sleepTime);
                    logger.error((error as Error).message);
                }
            } while (retryTimes > 0);
        };
        return descriptor;
    };
}
