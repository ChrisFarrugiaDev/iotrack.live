import redis, { redisKeyPrefix } from "../../config/redis.config";
import { logger } from "../logger.utils";

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

        logger.debug({ key: fullKey }, "Successfully saved hash to Redis");
    } catch (err) {
        logger.error({ err }, "! redisUtils saveHashToRedis !");
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
        logger.error({ err }, "! redisUtils hget !");
        throw err;
    }
}

// ---------------------------------------------------------------------

export async function hadd(
    key: string,
    field: string,
    value: any,
    prefix: string | null = null
): Promise<void> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        const storedValue =
            typeof value === "string" ? value : JSON.stringify(value);

        await redis.hset(fullKey, field, storedValue);

        logger.debug({ key: fullKey, field }, "Added/updated field in hash");
    } catch (err) {
        logger.error({ err }, "! redisUtils hadd !");
        throw err;
    }
}

// ---------------------------------------------------------------------

export async function hdel(
    key: string,
    fields: string | string[],
    prefix: string | null = null
): Promise<number> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        // ensure fields is always an array
        const fieldArray = Array.isArray(fields) ? fields : [fields];

        const deletedCount = await redis.hdel(fullKey, ...fieldArray);

        logger.debug(
            { key: fullKey, fields: fieldArray, deletedCount },
            "Deleted field(s) from hash"
        );

        return deletedCount; // number of fields actually removed
    } catch (err) {
        logger.error({ err }, "! redisUtils hdel !");
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

        logger.debug({ key: fullKey }, "Successfully replaced hash");


    } catch (err) {
        logger.error({ err }, "! redisUtils replaceHsetWithLua !");
        throw err;
    }
}
