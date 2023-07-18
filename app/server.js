import express, { json } from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import morgan from "morgan";
import * as UserRouter from "./api/routes/userRoute.js";
import * as TradeRouter from "./api/routes/tradeRoute.js";
import * as WalletRouter from "./api/routes/walletRoute.js";
import * as TransactionRouter from "./api/routes/transactionRoute.js";
import * as P2PRouter from "./api/routes/p2pRoute.js";
import { checkAuth } from "./api/middleware/authentication/checkAuth.js";
import { cronRedis, deleteAccessLog, backupAccessLog } from "./utils/cron.mjs";
import { errorHandler } from "./api/middleware/error/error-handler.js";
import * as RequestLogger from "./api/middleware/logger/requestLogger.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clear redis
cronRedis();

// Backups & delte the access logs
deleteAccessLog();
backupAccessLog();

app.use(morgan("dev"));
// app.use(morgan("combined", { stream: RequestLogger.accessLogStream }));
// app.use(morgan("combined"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./api/views"));
// app.use(cookieParser());

// middleware that requests will go through and responses that are sent back to the client will have headers appended to it
app.use((req, res, next) => {
  // const allowedOrigin = "https://crypthub-app.vercel.app";
  // if (req.headers.origin !== allowedOrigin) {
  //   res.status(403).send("FORBIDDEN");
  // }

  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  // method gives access to the http method used on the request
  if (req.method === "OPTIONS") {
    // methods that may be sent with the request
    res.header("Access-Control-Allow-Methods", "POST, GET");
    return res.status(200).json({});
  }
  next();
});

app.use("/user", UserRouter.router);
app.use("/trade", checkAuth, TradeRouter.router);
app.use("/wallet", checkAuth, WalletRouter.router);
app.use("/transaction", checkAuth, TransactionRouter.router);
app.use("/p2p", P2PRouter.router);

app.use(errorHandler);
// app.use("/test", testRouter);
// app.use((error, req, res, next) => {
//   if (error) {
//     console.log(error);
//     res.status(500).send({ error });
//   }
// });
app.listen(5000, () => console.log("Server running on port 5000"));
