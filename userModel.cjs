const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  banner: String,  
  image: String,
  desc: String,
  follower: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
})

const userData = mongoose.model("user", userSchema)
module.exports = userData;