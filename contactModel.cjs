const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  userId : String,
  message: String,  
  createdAt: { type: Date, default: Date.now }
})

const contactData = mongoose.model("contact", contactSchema)

module.exports = contactData;
