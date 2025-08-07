import Redis from "ioredis";

// Parse values and provide sensible defaults
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisDb = process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0;


const redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    db: redisDb,
    // keyPrefix: redisKeyPrefix,
});


export const redisKeyPrefix = "web.backend.node.ts:";

export default redis;