import redis, { redisKeyPrefix } from "../../config/redis.config";
import { logDebug, logError } from "../logger.utils";


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

        logDebug(`Successfully saved array to Redis list: ${fullKey}`);
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
