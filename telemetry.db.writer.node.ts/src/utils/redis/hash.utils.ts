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

export async function fetchAndDeleteHsetWithLua(
    key: string,
    prefix: string | null = null
): Promise<Record<string, any>> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        const luaScript = `
            local keyType = redis.call('TYPE', KEYS[1]).ok

            if keyType ~= 'none' and keyType ~= 'hash' then
                return redis.error_reply('WRONGTYPE Operation against a key holding the wrong kind of value')
            end

            local data = redis.call('HGETALL', KEYS[1])

            if #data > 0 then
                redis.call('DEL', KEYS[1])
            end

            return data
        `;

        const result = await redis.eval(luaScript, 1, fullKey) as string[];

        const parsedData: Record<string, Record<string, string | number> > = {};

        for (let i = 0; i < result.length; i += 2) {
            const field = result[i];
            const rawValue = result[i + 1];

            try {
                parsedData[field] = JSON.parse(rawValue);
            } catch {
                parsedData[field] = {"raw": rawValue};
            }
        }

        logDebug(`Successfully fetched and deleted hash from Redis: ${fullKey}`);

        return parsedData;
    } catch (err) {
        logError("! redisUtils fetchAndDeleteHsetWithLua !", err);
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




