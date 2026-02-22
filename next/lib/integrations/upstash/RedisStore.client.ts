import Redis from 'ioredis';
const redisClient = new Redis(process.env.UPSTASH_STORE!);
export default redisClient;
