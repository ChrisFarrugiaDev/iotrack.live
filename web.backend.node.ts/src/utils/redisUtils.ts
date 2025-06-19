import redis from "../config/redisConfig";
import { logDev, logError } from "./loggerUtils";


export async function saveToRedis(key: string, value: any, expireInSeconds: number | null = null): Promise<void> {

    if (expireInSeconds) {
        expireInSeconds = Math.round(expireInSeconds)
    }
    try {
        // If the value is not a string, convert it to JSON
        const dataToSave = typeof value === 'string' ? value : JSON.stringify(value);

        // Save the key-value pair in Redis
        await redis.set(key, dataToSave);

        // If an expiration time is provided, set it
        if (expireInSeconds) {
            await redis.expire(key, expireInSeconds);
        }

        logDev(`Successfully saved key: ${redis.options.keyPrefix}${key}`);

    } catch (err) {
        logError("! redisUtils saveToRedis !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------

// Checks if a key exists in Redis
export async function keyExists(key: string): Promise<boolean> {
    try {
        const exist = await redis.exists(key)

        return exist === 1;

    } catch (err) {
        logError("! redisUtils keyExists !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------

// Deletes a Redis key from the cache
export async function deleteKeyFromCache(key: string): Promise<boolean> {
    try {

        // Check if the key exists
        const exist = await redis.exists(key);
        if (!exist) {
            logDev(`Key ${redis.options.keyPrefix}${key} does not exist.`, 'yellow');
            return false;
        }

        // Delete the key
        await redis.del(key);

        logDev(`Successfully deleted the key: ${redis.options.keyPrefix}${key}`, 'green');
        return true;

    } catch (err) {
        logError("! redisUtils deleteKeyFromCache !", err);
        throw err;
    }
}

// ---------------------------------------------------------------------


// Adds a single item to a Redis list
export async function addItemToList(key: string, item: any) {
    try {
        // Convert the item to a JSON string if it's not a string
        const itemToAdd = typeof item === 'string' ? item : JSON.stringify(item);

        // Append the item to the Redis list
        await redis.rpush(key, itemToAdd);

        logDev(`Successfully added item to Redis list: ${redis.options.keyPrefix}${key}`);

    } catch (err) {
        logError('! addItemToList !', err);
        throw err;
    }
}


// ---------------------------------------------------------------------

// Saves an array into a Redis list.
export async function saveArrayToList(key: string, array: any[]) {
    try {
        if (!Array.isArray(array)) {
            throw new Error('The provided value is not an array.');
        }

        // Convert non-string values in the array to JSON strings
        array = array.map(value => typeof value === 'string' ? value : JSON.stringify(value));

        // Add each item in the array to the Redis list
        await redis.rpush(key, ...array);

        logDev(`Successfully saved array to Redis list: ${redis.options.keyPrefix}${key}`);
    } catch (err) {
        logError('! redisUtils saveArrayToList !', err);
        throw err;
    }
}

// ---------------------------------------------------------------------