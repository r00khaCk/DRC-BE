import { formatDate } from "./app/utils/commonFunctions.js";
import cron from "node-cron";
import fs from "fs";
import { google } from "googleapis";
import path from "path";
import { googleJSON } from "./config/config.js";
import { exec } from "child_process";

const crypthub_backup = googleJSON.privateKey;

cronBackup24hr();

function cronBackup24hr() {
  var task = cron.schedule("0 0 0 * * *", () => {
    dumpDB();
    backupData();
  });
  task.start();
}

function dumpDB() {
  const command =
    "sudo docker exec db-postgres-container pg_dumpall -c -U postgress > ./app/backups/backup.sql";

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing the command: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Error output: ${stderr}`);
      return;
    }

    console.log(`Database dump successful`);
  });
}

function backupData() {
  const timestamp = Date.now();
  const formattedDate = formatDate(timestamp);
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

    const drive = google.drive({
      version: "v3",
      auth: auth,
    });

    const folderPath = "./app/backups/";

    function uploadFolderToDrive(folderPath) {
      const folderMetadata = {
        name: `Crypthub Backup - ${formattedDate}`,
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

    function uploadFilesInFolder(folderId, folderPath) {
      const files = fs.readdirSync(folderPath);

      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory()) {
          uploadFilesInFolder(folderId, filePath);
        } else {
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
        }
      });
    }

    uploadFolderToDrive(folderPath);
  });
}
