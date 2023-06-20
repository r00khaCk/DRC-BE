import express, { json } from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import * as UserRouter from "./api/routes/userRoute.js";

const app = express();
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(json());
app.use("/user", UserRouter.router);

app.listen(5000, () => console.log("Server running on port 5000"));
