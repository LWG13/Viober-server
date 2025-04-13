const express = require("express");
const route = require("./route.cjs");
const cors = require("cors");
require("dotenv/config");
const connect = require("./connect.cjs");
var cron = require('node-cron');
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser");

const dotenv = require("dotenv");
const app = express();
app.use(cookieParser())
connect();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })); //Added urlencoded parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
dotenv.config();
route(app)
// Global promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
})
// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, '0.0.0.0', () => {
  console.log("Server Running on port 3000");
});


cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});