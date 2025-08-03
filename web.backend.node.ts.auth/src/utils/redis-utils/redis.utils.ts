import redis, { redisKeyPrefix } from "../../config/redis.config";
import { logDebug, logError } from "../logger.utils";


// ---------------------------------------------------------------------

// Save a key-value pair to Redis with optional expiry and prefix
export async function saveToCache(
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
        logError("! redisUtils saveToRedis !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------

// Checks if a key exists in Redis
export async function keyExists(key: string, prefix: string | null = null): Promise<boolean> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;
        const exist = await redis.exists(fullKey);
        return exist === 1;
    } catch (err) {
        logError("! redisUtils keyExists !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------

// Deletes a Redis key from the cache
export async function deleteKeyFromCache(key: string, prefix: string | null = null): Promise<boolean> {
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
        logError("! redisUtils deleteKeyFromCache !", err);
        throw err;
    }
}



// ---------------------------------------------------------------------

export async function saveHashToRedis(
    key: string,
    data: Record<string, any>,
    prefix: string | null = null
): Promise<void> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        const hashData: Record<string, string> = {};
        for (const field in data) {
            hashData[field] =
                typeof data[field] === 'string'
                    ? data[field]
                    : JSON.stringify(data[field]);
        }

        await redis.hset(fullKey, hashData);

        logDebug(`Successfully saved hash to Redis: ${fullKey}`);
    } catch (err) {
        logError("! redisUtils saveHashToRedis !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------

export async function replaceHashWithLua(
    key: string,
    data: Record<string, any>,
    prefix: string | null = null
): Promise<void> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        const luaScript = `
            redis.call('DEL', KEYS[1])
            if #ARGV > 0 then
                redis.call('HSET', KEYS[1], unpack(ARGV))
            end
            return 1
        `;

        // Flatten the object into [field1, value1, field2, value2, ...]
        const argv: string[] = [];
        for (const field in data) {
            const value = typeof data[field] === 'string'
                ? data[field]
                : JSON.stringify(data[field]);
            argv.push(field, value);
        }

        await redis.eval(luaScript, 1, fullKey, ...argv);

        logDebug(`Successfully replaced hash with key: ${fullKey}`);
    } catch (err) {
        logError("! redisUtils replaceHashWithLua !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------

export async function getHashField(
    key: string,
    field: string,
    prefix: string | null = null
): Promise<any | null> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        const rawValue = await redis.hget(fullKey, field);
        if (rawValue === null) return null;

        try {
            return JSON.parse(rawValue);
        } catch {
            return rawValue;
        }
    } catch (err) {
        logError("! redisUtils getHashField !", err);
        throw err;
    }
}