import config from "@config";
import appLogger from "@shared/lib/logger";
import Redis, { RedisOptions } from "ioredis";

import { NOTIFICATION_REDIS_CHANNEL_PREFIX } from "./notification.constants";
import { NotificationPayload } from "./notification.type";

type NotificationHandler = (
    userId: string,
    payload: NotificationPayload,
) => void;

class NotificationPubSub {
    private publisher: null | Redis = null;
    private subscriber: null | Redis = null;

    buildUserChannel(userId: string): string {
        return `${NOTIFICATION_REDIS_CHANNEL_PREFIX}${userId}`;
    }

    async disconnect(): Promise<void> {
        await Promise.all([this.publisher?.quit(), this.subscriber?.quit()]);
        this.publisher = null;
        this.subscriber = null;
    }

    async publish(userId: string, payload: NotificationPayload): Promise<void> {
        const channel = this.buildUserChannel(userId);
        await this._getPublisher().publish(channel, JSON.stringify(payload));
    }

    async subscribe(handler: NotificationHandler): Promise<void> {
        const subscriber = this._getSubscriber();
        await subscriber.psubscribe(`${NOTIFICATION_REDIS_CHANNEL_PREFIX}*`);
        subscriber.on("pmessage", (_pattern, channel, message) => {
            const userId = channel.slice(
                NOTIFICATION_REDIS_CHANNEL_PREFIX.length,
            );
            if (!userId) return;
            try {
                const payload = JSON.parse(message) as NotificationPayload;
                handler(userId, payload);
            } catch (error) {
                appLogger.error("Failed to parse notification pubsub message", {
                    channel,
                    error,
                });
            }
        });
    }

    private _createClient(): Redis {
        const options: RedisOptions = {
            db: config.db.redis.db,
            host: config.db.redis.host,
            maxRetriesPerRequest: null,
            password: config.db.redis.password,
            port: config.db.redis.port,
            retryStrategy: (times: number) => Math.min(times * 50, 2000),
            username: config.db.redis.username,
        };
        const client = new Redis(options);
        client.on("error", (error: Error) => {
            appLogger.error(error);
        });
        return client;
    }

    private _getPublisher(): Redis {
        if (!this.publisher) {
            this.publisher = this._createClient();
        }
        return this.publisher;
    }

    private _getSubscriber(): Redis {
        if (!this.subscriber) {
            this.subscriber = this._createClient();
        }
        return this.subscriber;
    }
}

const notificationPubSub = new NotificationPubSub();
export default notificationPubSub;
