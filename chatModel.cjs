const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
    user1: String,
    user2: String,
    image1: String, 
    username1: String,
    image2: String,
    username2: String,
    
    createdAt: { type: Date, default: Date.now }
});
const chatData = mongoose.model("chat", chatSchema)

module.exports = chatData;

