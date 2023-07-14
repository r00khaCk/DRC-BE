import cron from "node-cron";
import Redis from "ioredis";
import fs from "fs";
import { google } from "googleapis";

const env = process.env;
const crypthub_backup = JSON.parse(env.DB_BACKUP_PK);

const redisClient = new Redis({
  host: "redis",
  port: 6379,
  password: env.REDIS_PASSWORD,
});

export function cron24hr() {
  var task = cron.schedule("0 0 0 * * *", () => {
    redisClearCache();
  });
  task.start();
}

function redisClearCache() {
  let time = Date.now() - 1000 * 86400;
  redisClient.zremrangebyscore("blacklisted", 0, time);
}

backupDB();

function backupDB() {
  const auth = new google.auth.JWT(
    crypthub_backup.client_email,
    null,
    crypthub_backup.private_key,
    ["https://www.googleapis.com/auth/drive"]
  );

  auth.authorize((err) => {
    if (err) {
      console.error("Error authenticating:", err);
      return;
    }

    console.log("Authentication successful.");

    // Create a Google Drive instance
    const drive = google.drive({
      version: "v3",
      auth: auth,
    });

    // Specify the path to the folder you want to upload
    const folderPath = "/var/lib/postgresql/data";
    // https://drive.google.com/drive/folders/1BLuWIvpeiGhjOM3SZ-g4hiMTgf3qbjS1?usp=sharing

    // Upload the folder to Google Drive
    function uploadFolderToDrive(folderPath) {
      const folderMetadata = {
        name: "Database Backup",
        mimeType: "application/vnd.google-apps.folder",
        parents: ["1BLuWIvpeiGhjOM3SZ-g4hiMTgf3qbjS1"],
      };

      drive.files.create(
        {
          resource: folderMetadata,
          fields: "id",
        },
        (err, folder) => {
          if (err) {
            console.error("Error creating folder:", err);
            return;
          }

          console.log("Folder created with ID:", folder.data.id);

          uploadFilesInFolder(folder.data.id, folderPath);
        }
      );
    }

    // Upload individual files inside the folder
    function uploadFilesInFolder(folderId, folderPath) {
      const files = fs.readdirSync(folderPath);

      files.forEach((file) => {
        const filePath = `${folderPath}/${file}`;

        const fileMetadata = {
          name: file,
          parents: [folderId],
        };

        const media = {
          mimeType: "application/octet-stream",
          body: fs.createReadStream(filePath),
        };

        drive.files.create(
          {
            resource: fileMetadata,
            media: media,
            fields: "id",
          },
          (err, uploadedFile) => {
            if (err) {
              console.error("Error uploading file:", err);
              return;
            }

            console.log("File uploaded with ID:", uploadedFile.data.id);
          }
        );
      });
    }

    // Call the function to start the upload process
    uploadFolderToDrive(folderPath);
  });
}
