const mongoose = require("mongoose");

const connect = () => {
  mongoose.connect(process.env.LWG_DATABASE, {
    dbName: "Viober"
  })
  .catch(error => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with an error code
  });
};

module.exports = connect;