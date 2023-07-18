import cron from "node-cron";
import Redis from "ioredis";
import fs from "fs";

const env = process.env;
const backupPath = "/usr/src/app/backups/access-logs/";
const accessLogPath = "/usr/src/app/api/middleware/logger/access.log";

const redisClient = new Redis({
  host: "redis",
  port: 6379,
  password: env.REDIS_PASSWORD,
});

export function cronRedis() {
  var task = cron.schedule("0 0 0 * * *", () => {
    redisClearCache();
  });
  task.start();
}

function redisClearCache() {
  let time = Date.now() - 1000 * 86400;
  redisClient.zremrangebyscore("blacklisted", 0, time);
}

// backups the access logs every 30 minutes
export const backupAccessLog = () => {
  var task = cron.schedule("30 * * * *", () => {
    let timestamp = Date.now();
    console.log("---------------------------------------");
    console.log("Access log backup");
    fs.copyFile(
      accessLogPath,
      `${backupPath}access-log-${timestamp}.log`,
      (error) => {
        if (error) {
          console.log("Error backing up access log: ", error);
        } else {
          console.log("Backup successful");
        }
      }
    );
  });
  task.start();
};

// clears the access logs at 00:30 daily
export const deleteAccessLog = () => {
  var task = cron.schedule("30 0 * * *", () => {
    console.log("------------------");
    console.log("deleting old access logs");
    fs.unlink(`${accessLogPath}`, (err) => {
      if (err) throw err;
      console.log("Access log deleted");
    });
    fs.rmdir(`${backupPath}`, (err) => {
      if (err) throw err;
      console.log("Access log deleted");
    });
  });
  task.start();
};
