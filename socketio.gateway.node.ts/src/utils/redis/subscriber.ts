import { logger } from "../logger.utils";
import { createRedisSubscriberClient } from "../../config/redis.config";
import { createBurstForwarder } from "./queue.forwarder";

export function createRedisSubscriber(onMessage: (msg: any) => void) {
    const sub = createRedisSubscriberClient();
    const CHANNEL = process.env.LIVE_CHANNEL || "teltonika:live";

    const enqueue = createBurstForwarder(onMessage, 500);

    sub.on("error", (err) => {
        logger.error({ err }, "Redis subscriber error");
    });

    sub.on("end", () => {
        logger.warn("Redis subscriber connection closed");
    });

    sub.on("reconnecting", () => {
        logger.warn("Redis subscriber reconnecting…");
    });

    sub.subscribe(CHANNEL, (err) => {
        if (err) logger.error({ err }, "Redis SUBSCRIBE failed");
        else logger.info(`Redis subscribed to ${CHANNEL}`);
    });

    sub.on("message", (_channel, message) => {
        try {
            const data = JSON.parse(message);
            // For now, just enqueue → onMessage (console.log or later socket.io emit)
            enqueue(data);
        } catch (e) {
            logger.warn({ message }, "Invalid JSON in pub/sub");
        }
    });

    return sub; // return the client so App can close it gracefully
}
