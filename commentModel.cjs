const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  usernamePost: { type: String, required: true },
  userImage: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  userId : String,
  usernamePost: String,
  userImage: String,
  content: String,
  type: String,
  media: String,
  postId: String, 
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
})

const commentData = mongoose.model("comment", commentSchema)
module.exports = commentData;