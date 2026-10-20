require("dotenv").config();
const express = require("express");
const { createHandler } = require("./lib/contact-handler.cjs");
const app = express();
app.use(express.json({ limit: "3mb" }));
app.post(["/contact", "/api/contact"], createHandler());
app.listen(process.env.PORT || 5000, () =>
  console.log("Contact server running."),
);
