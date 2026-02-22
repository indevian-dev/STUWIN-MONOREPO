import Redis from "ioredis";

const redisClient = new Redis(process.env.UPSTASH_REDIS_CACHE!);

export default redisClient;

