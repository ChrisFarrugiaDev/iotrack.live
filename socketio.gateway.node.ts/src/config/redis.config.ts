import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisDb = process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0;

export const redisKeyPrefix = "socketio.gateway.node.ts:";

// General-purpose Redis (NOT used for SUBSCRIBE)
const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  db: redisDb,
  maxRetriesPerRequest: null,
});

export default redis;

// Dedicated subscriber connection factory
export function createRedisSubscriberClient() {
  return new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    db: redisDb,
    maxRetriesPerRequest: null,
  });
}
