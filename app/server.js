import express, { json } from "express";
import Users from "./users.js";
import database from "./services/db.js";

const users = new Users(database);
const app = express();
app.use(json());
app.get("/users", function (req, res) {
  users.list(req, res);
});
app.get("/test", function (req, res) {
  res.send("Test");
});

app.listen(5000, () => console.log("Server running on port 5000"));
