const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId : String,
  usernamePost: String,
  userImage: String,
  content: String,
  type: String,
  media: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
})

const postData = mongoose.model("post", postSchema)

module.exports = postData;
