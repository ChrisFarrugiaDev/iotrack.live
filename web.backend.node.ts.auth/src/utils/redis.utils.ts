import redis, { redisKeyPrefix } from "../config/redis.config";
import { logDebug, logError } from "./logger.utils";


export * from "./redis/hash.utils";


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

        logDebug(`Successfully saved key: ${fullKey}`);
    } catch (err) {
        logError("! redisUtils set !", err);
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
        logError("! redisUtils exists !", err);
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
        logError("! redisUtils get !", err);
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
            logDebug(`Key ${fullKey} does not exist.`, 'yellow');
            return false;
        }

        await redis.del(fullKey);
        logDebug(`Successfully deleted the key: ${fullKey}`, 'green');
        return true;
    } catch (err) {
        logError("! redisUtils del !", err);
        throw err;
    }
}



// ---------------------------------------------------------------------

