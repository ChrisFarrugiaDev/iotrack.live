import redis, { redisKeyPrefix } from "../../config/redis.config";
import { logger } from "../logger.utils";

// Adds one or more members to a Redis set. Duplicate values are ignored by Redis.
export async function sadd(
    key: string,
    values: string[] | string,
    prefix: string | null = null
): Promise<void> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;
        const members = Array.isArray(values) ? values : [values];

        if (members.length === 0) return;

        await redis.sadd(fullKey, ...members);

        logger.debug({ key: fullKey, members }, "SADD: Added to set");
    } catch (err) {
        logger.error({ err }, "! redisUtils sadd !");
        throw err;
    }
}

// Retrieves all members of a Redis set.
export async function smembers(
    key: string,
    prefix: string | null = null
): Promise<string[]> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;
        const members: string[] = await redis.smembers(fullKey);

        logger.debug({ key: fullKey, members }, "SMEMBERS: Members of set");
        return members;
    } catch (err) {
        logger.error({ err }, "! redisUtils smembers !");
        throw err;
    }
}

export async function smembersAndDeleteWithLua(
    key: string,
    prefix: string | null = null
): Promise<string[]> {
    try {
        const usedPrefix = prefix ?? redisKeyPrefix ?? "";
        const fullKey = `${usedPrefix}${key}`;

        const luaScript = `
            local members = redis.call('SMEMBERS', KEYS[1])
            redis.call('DEL', KEYS[1])
            return members
        `;

        // `eval` returns the result directly
        const members = await redis.eval(luaScript, 1, fullKey) as string[];

        logger.debug({ key: fullKey, members }, "SMEMBERS+DEL: Retrieved and deleted set");
        return members || [];
    } catch (err) {
        logger.error({ err }, "! redisUtils smembersAndDeleteLua !");
        throw err;
    }
}
