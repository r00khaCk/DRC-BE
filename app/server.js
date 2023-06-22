import express, { json } from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import morgan from "morgan";
// import cookieParser from "cookie-parser";
import * as UserRouter from "./api/routes/userRoute.js";
import testRouter from "./api/routes/test-route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./api/views"));
// app.use(cookieParser());
app.use("/user", UserRouter.router);

// app.use("/test", testRouter);
// app.use((error, req, res, next) => {
//   if (error) {
//     console.log(error);
//     res.status(500).send({ error });
//   }
// });

app.listen(5000, () => console.log("Server running on port 5000"));
