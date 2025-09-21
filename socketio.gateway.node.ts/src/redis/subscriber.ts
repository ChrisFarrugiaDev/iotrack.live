/**
 * Redis Subscriber
 * ----------------
 * This module listens to a Redis Pub/Sub channel (e.g. "teltonika:live")
 * and forwards incoming messages to a callback. Messages are first queued
 * in a burst forwarder so that if Redis publishes many at once, we don't
 * overwhelm Socket.IO or other consumers with thousands of synchronous
 * callbacks. Instead, they are drained in batches (default max 500 per tick).
 *
 * Usage:
 *   const sub = createRedisSubscriber(msg => console.log(msg));
 *   // later in shutdown: await sub.quit()
 */

import { logger } from "../utils/logger.utils";
import { createRedisSubscriberClient } from "../config/redis.config";
import { createBurstForwarder } from "./queue.forwarder";

export function createRedisSubscriber(onMessage: (msg: any) => void) {
    // Create a dedicated Redis connection in "subscriber" mode
    const sub = createRedisSubscriberClient();

    // Channel to listen on (configurable by env)
    const CHANNEL = process.env.LIVE_CHANNEL || "teltonika:live";

    // Wrap callback with burst forwarder (prevents flooding)
    const enqueue = createBurstForwarder(onMessage, 500);

    // Log connection issues
    sub.on("error", (err) => {
        logger.error({ err }, "Redis subscriber error");
    });

    sub.on("end", () => {
        logger.warn("Redis subscriber connection closed");
    });

    sub.on("reconnecting", () => {
        logger.warn("Redis subscriber reconnecting…");
    });

    // Subscribe to channel
    sub.subscribe(CHANNEL, (err) => {
        if (err) logger.error({ err }, "Redis SUBSCRIBE failed");
        else logger.info(`Redis subscribed to ${CHANNEL}`);
    });

    // Handle each published message
    sub.on("message", (_channel, message) => {
        try {
            const data = JSON.parse(message);
            // Queue the message for batched forwarding
            enqueue(data);
        } catch (e) {
            // If JSON parsing fails, log but continue
            logger.warn({ message }, "Invalid JSON in pub/sub");
        }
    });

    // Return the subscriber client so caller can close gracefully
    return sub;
}
