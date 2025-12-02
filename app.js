const express = require('express');
const postRouter = require("./services/postService");
const app = express();

app.use(express.json());

app.use("/", postRouter);

module.exports = app;
