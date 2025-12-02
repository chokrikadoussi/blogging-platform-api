const express = require('express');
const postRouter = require("./services/postService");
const notFound = require("./middlewares/notFound");
const app = express();

app.use(express.json());

app.use("/", postRouter);
app.use(notFound);

module.exports = app;
