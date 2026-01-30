import Redis from "ioredis";

const redisUpstashStoreClient = new Redis(process.env.UPSTASH_STORE!);

export default redisUpstashStoreClient;

