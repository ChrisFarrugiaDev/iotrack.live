import redis, { redisKeyPrefix } from "../config/redis.config";
import { logger } from "./logger.utils";

export * from "./redis/hash.utils";
export * from "./redis/set.utils";
export * from "./redis/list.utils";

// ---------------------------------------------------------------------

// Save a key-value pair to Redis with optional expiry and prefix
export async function set(
    key: string,
    value: any,
    expireInSeconds: number | null = null,
    prefix: string | null = null
): Promise<void> {
    if (expireInSeconds) expireInSeconds = Math.round(expireInSeconds);

    try {
        const dataToSave = typeof value === 'string' ? value : JSON.stringify(value);
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        await redis.set(fullKey, dataToSave);

        if (expireInSeconds) {
            await redis.expire(fullKey, expireInSeconds);
        }

        logger.debug({ key: fullKey, expireInSeconds }, "Successfully saved key to Redis");
    } catch (err) {
        logger.error({ err }, "! redisUtils set !");
        throw err;
    }
}

// ---------------------------------------------------------------------

// Checks if a key exists in Redis
export async function exists(key: string, prefix: string | null = null): Promise<boolean> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;
        const exist = await redis.exists(fullKey);
        return exist === 1;
    } catch (err) {
        logger.error({ err }, "! redisUtils exists !");
        throw err;
    }
}

// ---------------------------------------------------------------------

export async function get(
    key: string,
    prefix: string | null = null
): Promise<any | null> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;
        const value = await redis.get(fullKey);

        if (value === null) return null;

        try {
            // Try to parse as JSON, fall back to raw string
            return JSON.parse(value);
        } catch {
            return value;
        }
    } catch (err) {
        logger.error({ err }, "! redisUtils get !");
        throw err;
    }
}

// ---------------------------------------------------------------------

// Deletes a Redis key from the cache
export async function del(key: string, prefix: string | null = null): Promise<boolean> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        const exist = await redis.exists(fullKey);
        if (!exist) {
            logger.debug({ key: fullKey }, "Key does not exist");
            return false;
        }

        await redis.del(fullKey);
        logger.debug({ key: fullKey }, "Successfully deleted the key from Redis");
        return true;
    } catch (err) {
        logger.error({ err }, "! redisUtils del !");
        throw err;
    }
}
