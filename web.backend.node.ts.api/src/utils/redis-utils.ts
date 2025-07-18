import redis, {redisKeyPrefix} from "../config/redis.config";
import { logDev, logError } from "./logger-utils";




// ---------------------------------------------------------------------

// Save a key-value pair to Redis with optional expiry and prefix
export async function saveToRedis(
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

        logDev(`Successfully saved key: ${fullKey}`);
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
            logDev(`Key ${fullKey} does not exist.`, 'yellow');
            return false;
        }

        await redis.del(fullKey);
        logDev(`Successfully deleted the key: ${fullKey}`, 'green');
        return true;
    } catch (err) {
        logError("! redisUtils deleteKeyFromCache !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------

// Adds a single item to a Redis list
export async function addItemToList(key: string, item: any, prefix: string | null = null) {
    try {
        const itemToAdd = typeof item === 'string' ? item : JSON.stringify(item);
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;
        await redis.rpush(fullKey, itemToAdd);

        logDev(`Successfully added item to Redis list: ${fullKey}`);
    } catch (err) {
        logError('! addItemToList !', err);
        throw err;
    }
}

// ---------------------------------------------------------------------


// Saves an array into a Redis list, with optional key prefix
export async function saveArrayToList(
    key: string,
    array: any[],
    prefix: string | null = null
) {
    try {
        if (!Array.isArray(array)) {
            throw new Error('The provided value is not an array.');
        }

        // Convert non-string values in the array to JSON strings
        array = array.map(value =>
            typeof value === 'string' ? value : JSON.stringify(value)
        );

        // Choose prefix: passed-in, default from config, or empty string
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        await redis.rpush(fullKey, ...array);

        logDev(`Successfully saved array to Redis list: ${fullKey}`);
    } catch (err) {
        logError('! redisUtils saveArrayToList !', err);
        throw err;
    }
}


// ---------------------------------------------------------------------

// Gets the length of a Redis list with optional key prefix
export async function listLength(
    key: string,
    prefix: string | null = null
): Promise<number> {
    const usedPrefix = prefix ?? redisKeyPrefix ?? "";
    const fullKey = `${usedPrefix}${key}`;
    const length = await redis.llen(fullKey);
    return length;
}

// ---------------------------------------------------------------------