import redis, { redisKeyPrefix } from "../../config/redis.config";
import { logDebug, logError } from "../logger.utils";

export async function hset(
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

export async function replaceHsetWithLua(
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
        logError("! redisUtils replaceHsetWithLua !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------

export async function hget(
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
        logError("! redisUtils hget !", err);
        throw err;
    }
}




