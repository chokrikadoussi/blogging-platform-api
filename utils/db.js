const mysql = require("mysql2");
require("dotenv").config();

let pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 4
})

pool.on("error", (err) => {
  console.log(err);
})

const promisePool = pool.promise();

module.exports = promisePool;