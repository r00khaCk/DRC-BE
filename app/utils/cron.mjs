import cron from "node-cron";
import Redis from "ioredis";

const env = process.env;
const redisClient = new Redis({
  host: "redis",
  port: 6379,
  password: env.REDIS_PASSWORD,
});

export function cronRedis() {
  var task = cron.schedule("0 0 0 * * *", () => {
    let time = Date.now() - 1000 * 86400;
    redisClient.zremrangebyscore("blacklisted", 0, time);
  });
  task.start();
}
