import express, { json } from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import * as UserRouter from "./api/routes/userRoute.js";
import testRouter from "./api/routes/test-route.js";

const app = express();
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser());
app.use("/user", UserRouter.router);

// app.use("/test", testRouter);
// app.use((error, req, res, next) => {
//   if (error) {
//     console.log(error);
//     res.status(500).send({ error });
//   }
// });

app.listen(5000, () => console.log("Server running on port 5000"));
