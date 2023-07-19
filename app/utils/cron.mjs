import cron from "node-cron";
import Redis from "ioredis";
import fs from "fs";
import { promisify } from "util";

const env = process.env;
const backupPath = "/usr/src/app/backups/access-logs/";
const accessLogPath = "/usr/src/app/api/middleware/logger/access.log";

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

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

// backups the access logs every 3 hours
export const backupAccessLog = () => {
  var task = cron.schedule("0 */3 * * *", () => {
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
  var task = cron.schedule("30 0 * * *", async () => {
    console.log("------------------");
    console.log("deleting old access logs");
    await unlink(accessLogPath, (err) => {
      if (err) throw err;
      console.log("Access log deleted");

      fs.writeFile(accessLogPath, "", (err) => {
        if (err) {
          console.error("Error creating new access log file:", err);
        } else {
          console.log("New access log file created");
        }
      });
    });

    try {
      // Read all files in the backup folder
      const files = await readdir(backupPath);

      // Delete each file
      await Promise.all(
        files.map((file) => {
          unlink(`${backupPath}${file}`);
        })
      );

      console.log("Access logs deleted");
    } catch (err) {
      console.error("Error deleting access logs:", err);
      throw err;
    }
  });
  task.start();
};
