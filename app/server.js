const express = require("express");

const app = express();
let count = 0;

app.get("/", (req, res) => {
  count++;
  res.send(`test connection: ${count} times`);
});

app.listen(5000, () => console.log("Server running on port 5000"));
