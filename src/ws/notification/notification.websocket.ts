import config from "@config";
import appJwt from "@shared/lib/jwt";
import appLogger from "@shared/lib/logger";
import { Server as HttpServer, IncomingMessage } from "http";
import { Duplex } from "stream";
import { WebSocket, WebSocketServer } from "ws";

import {
    NOTIFICATION_WS_EVENT,
    NOTIFICATION_WS_PATH,
    NOTIFICATION_WS_PING_INTERVAL_MS,
} from "./notification.constants";
import notificationPubSub from "./notification.pubsub";
import { NotificationPayload } from "./notification.type";

type ClientState = {
    isAlive: boolean;
    userId: string;
};

class NotificationWebSocketHub {
    private readonly clientsByUserId = new Map<string, Set<WebSocket>>();
    private readonly clientState = new WeakMap<WebSocket, ClientState>();
    private pingInterval: NodeJS.Timeout | null = null;
    private wss: null | WebSocketServer = null;

    async init(server: HttpServer): Promise<void> {
        if (this.wss) return;
        this.wss = new WebSocketServer({ noServer: true });
        server.on("upgrade", (req, socket, head) => {
            this._handleUpgrade(req, socket, head);
        });
        await notificationPubSub.subscribe((userId, payload) => {
            this._broadcastToUser(userId, payload);
        });
        this._startHeartbeat();
        appLogger.info("Notification WebSocket hub initialized", {
            path: NOTIFICATION_WS_PATH,
            port: config.port,
        });
    }

    private _addClient(userId: string, ws: WebSocket): void {
        const clients =
            this.clientsByUserId.get(userId) ?? new Set<WebSocket>();
        clients.add(ws);
        this.clientsByUserId.set(userId, clients);
    }

    private _broadcastToUser(
        userId: string,
        payload: NotificationPayload,
    ): void {
        const clients = this.clientsByUserId.get(userId);
        if (!clients?.size) return;
        const message = JSON.stringify({
            data: payload,
            event: NOTIFICATION_WS_EVENT.NOTIFICATION,
        });
        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    }

    private _extractToken(req: IncomingMessage): null | string {
        const url = new URL(req.url ?? "", `http://${req.headers.host}`);
        const token = url.searchParams.get("token");
        return token?.trim() ? token : null;
    }

    private _handleClientMessage(ws: WebSocket, raw: string): void {
        const state = this.clientState.get(ws);
        if (!state) return;
        let message: { event?: string };
        try {
            message = JSON.parse(raw) as { event?: string };
        } catch {
            return;
        }
        if (message.event === NOTIFICATION_WS_EVENT.PING) {
            ws.send(JSON.stringify({ event: NOTIFICATION_WS_EVENT.PONG }));
        }
        if (message.event === NOTIFICATION_WS_EVENT.PONG) {
            state.isAlive = true;
        }
    }

    private _handleUpgrade(
        req: IncomingMessage,
        socket: Duplex,
        head: Buffer,
    ): void {
        const url = new URL(req.url ?? "", `http://${req.headers.host}`);
        if (url.pathname !== NOTIFICATION_WS_PATH) return;
        const token = this._extractToken(req);
        if (!token) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }
        const verified = appJwt.verifyToken(token, "access");
        if (!verified.valid) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }
        this.wss?.handleUpgrade(req, socket, head, (ws) => {
            this._registerClient(ws, verified.payload.userId);
        });
    }

    private _registerClient(ws: WebSocket, userId: string): void {
        const state: ClientState = { isAlive: true, userId };
        this.clientState.set(ws, state);
        this._addClient(userId, ws);
        ws.on("message", (raw) => {
            this._handleClientMessage(ws, raw.toString());
        });
        ws.on("pong", () => {
            const clientState = this.clientState.get(ws);
            if (clientState) clientState.isAlive = true;
        });
        ws.on("close", () => {
            this._removeClient(userId, ws);
            this.clientState.delete(ws);
        });
        ws.on("error", (error) => {
            appLogger.error("Notification WebSocket client error", { error });
            this._removeClient(userId, ws);
            this.clientState.delete(ws);
        });
    }

    private _removeClient(userId: string, ws: WebSocket): void {
        const clients = this.clientsByUserId.get(userId);
        if (!clients) return;
        clients.delete(ws);
        if (!clients.size) {
            this.clientsByUserId.delete(userId);
        }
    }

    private _startHeartbeat(): void {
        this.pingInterval = setInterval(() => {
            for (const [userId, clients] of this.clientsByUserId.entries()) {
                for (const client of [...clients]) {
                    const state = this.clientState.get(client);
                    if (!state) continue;
                    if (!state.isAlive) {
                        client.terminate();
                        this._removeClient(userId, client);
                        this.clientState.delete(client);
                        continue;
                    }
                    state.isAlive = false;
                    client.ping();
                    client.send(
                        JSON.stringify({ event: NOTIFICATION_WS_EVENT.PING }),
                    );
                }
            }
        }, NOTIFICATION_WS_PING_INTERVAL_MS);
        this.pingInterval.unref();
    }
}

const notificationWebSocketHub = new NotificationWebSocketHub();

export const initNotificationWebSocket = async (
    server: HttpServer,
): Promise<void> => {
    await notificationWebSocketHub.init(server);
};

export default notificationWebSocketHub;
