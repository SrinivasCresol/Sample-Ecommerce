require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const job = require("./cron");

require("./db/Connect");
const router = require("./Router/Routes");

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(router);
job.start();

//Dummy Url for Cron Jobs

app.get("/", async (req, res) => {
  res.send("Cron Jobs Restarting the Server every 14 Minutes");
});

app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
