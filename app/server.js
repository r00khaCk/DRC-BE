import express, { json } from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import morgan from "morgan";
// import cookieParser from "cookie-parser";
import * as UserRouter from "./api/routes/userRoute.js";
import * as TradeRouter from "./api/routes/tradeRoute.js";
import { checkAuth } from "./api/middleware/authentication/checkAuth.js";
import testRouter from "./api/routes/test-route.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./api/views"));
// app.use(cookieParser());

// middleware that requests will go through and responses that are sent back to the client will have headers appended to it
app.use((req, res, next) => {
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
// app.use("/test", testRouter);
// app.use((error, req, res, next) => {
//   if (error) {
//     console.log(error);
//     res.status(500).send({ error });
//   }
// });

app.listen(5000, () => console.log("Server running on port 5000"));
