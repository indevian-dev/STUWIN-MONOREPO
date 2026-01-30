import Redis from 'ioredis';
const redisClient = new Redis(process.env.UPSTASH_SESSION!);
export default redisClient;
