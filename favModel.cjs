const mongoose = require("mongoose");



const favSchema = new mongoose.Schema({
  postId : String,
  userFavId: String,
  usernamePost: String,
  userImage: String,
  content: String,
  type: String,
  media: String,
  createdAt: { type: Date, default: Date.now }
})

const favData = mongoose.model("fav", favSchema)

module.exports = favData;
