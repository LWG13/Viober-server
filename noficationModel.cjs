const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
    userGetId: String,
    userPostId: String,
    postId: String,
    message: String,
    username: String,
    image: String,
    isRead: { type: Boolean, default: false },
    type: String,
    createdAt: { type: Date, default: Date.now }
});
const nofication = mongoose.model("nofication", notificationSchema);
module.exports = nofication