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


// ---------------------------------------------------------------------

// Add or update fields in an existing Redis hash
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

        logDebug(`Added/updated field "${field}" in hash: ${fullKey}`);
    } catch (err) {
        logError("! redisUtils hadd !", err);
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
        console.log(">", fieldArray)

        const deletedCount = await redis.hdel(fullKey, ...fieldArray);

        logDebug(
            `Deleted ${deletedCount} field(s) [${fieldArray.join(", ")}] from hash: ${fullKey}`
        );

        return deletedCount; // number of fields actually removed
    } catch (err) {
        logError("! redisUtils hdel !", err);
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





