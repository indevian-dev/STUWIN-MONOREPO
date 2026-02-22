import Redis from "ioredis";

// Create a function to get Redis client instance
const redisUpstashSessionClient = new Redis(process.env.UPSTASH_SESSION!);

export default redisUpstashSessionClient;

