const express = require("express")
const cloudinary = require("./cloudinary.cjs")
const sanitize = require("mongo-sanitize")
const chatModel = require("./chatModel.cjs")
const jwt = require("jsonwebtoken")
const userRouter = express.Router()
const mongoose = require("mongoose")
const userModel = require("./userModel.cjs")
const bcrypt = require("bcrypt")
const genAuthToken = require("./jwt.cjs")
const postModel = require("./postModel.cjs")
const nodemailer = require("nodemailer")
const otpGenerator = require('otp-generator')
const admin = require("./firebaseConfig.cjs");
const { ObjectId } = require('mongodb')
const cookieParser = require("cookie-parser")
const nofication = require("./noficationModel.cjs")
userRouter.use(cookieParser())
const otpSchema = new mongoose.Schema({
    otp: String,
    createdAt: { type: Date, expires: '5m', default: Date.now }
});
const modelOtp = mongoose.model("otp", otpSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
})






async function send(email, otp) {
    const result = await transporter.sendMail({
        from: process.env.GMAIL_EMAIL,
        to: email,
        subject: 'Hello!',
        text: `your otp number is ${otp}`
    });

    console.log(JSON.stringify(result, null, 4));
}

const friendSchema = new mongoose.Schema({
    user1: String,
    user2: String,
    image1: String,
    username1: String,
    image2: String,
    username2: String,
    type: String,
    isFriend: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const friend = mongoose.model("friend", friendSchema);

const messageSchema = new mongoose.Schema({
  roomId: String,
  userPost: String,
  image: String,
  message: String,
  username: String,
  media: String,
  type: String,
  createdAt: { type: Date, default: Date.now }
});
const messages = mongoose.model("message", messageSchema);

userRouter.get("/users", async (req, res) => {
  try{
  userModel.find().then(users => {
    res.json(users)
  })
 } catch(err) {
   console.log(err)
  }
})
userRouter.get("/users/:_id", async (req, res ) => {
    try{

const id = new ObjectId(req.params._id); 
    userModel.findOne({_id: id}).lean().then(user => {
      res.json(user)
    })
  } catch(err){
    console.log(err)
    }
})

userRouter.post("/signup", async (req, res) => {
  try {
   const email1 = sanitize(req.body.email)
   const password = sanitize(req.body.password)
    let email = await userModel.findOne({email: email1})
    if(email) {
      return res.status(400).send("Email already exists..")
    }

    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)
    const user = new userModel({
      username: req.body.username,
      email: email1,
      password: hashPassword,
      banner: req.body.banner,
      image: "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
      desc: "User dont't have any description...."
    })

    const Luser = await user.save()
    const token = genAuthToken(Luser)
    
  res.send(token)
  } catch (err) {
    console.log(err)
  }
})

userRouter.post("/login", async (req, res) => {
    const password = sanitize(req.body.password.toString())
    let email = await userModel.findOne({email: req.body.email})
  console.log(email?.password)
  console.log(req.body.password)
  if(!email) {
      return res.status(400).send("Invalid email")
    }

    const validPassword = await bcrypt.compare(password, email?.password)
  console.log(validPassword)
  if(!validPassword) {
    return res.status(400).send("invalid password")
  }
  const token = genAuthToken(email)
  
  res.send(token)
})



// Đăng nhập & đăng ký bằng Google
userRouter.post("/google-login", async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: "No token provided" });
    }

    try {
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token.toString());
        const { uid, email } = decodedToken;
        const name = decodedToken.name || email.split('@')[0];
        const picture = decodedToken.picture || "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

        // Check if user exists in database
        let user = await userModel.findOne({ email });

        if (!user) {
            // Create new user if doesn't exist
            user = new userModel({
                username: name,
                email: email,
                image: picture,
                desc: "User doesn't have any description"
            });
            await user.save();
        }
      
        const backendToken = genAuthToken(user);
        res.send(backendToken);
    } catch (error) {
        console.error("Google Authentication Error:", error);
        res.status(401).json({ message: "Invalid token" });
    }
});

userRouter.put("/follower/:_id", async (req, res) => {
    try {
    const followerId  = req.body.followerId;
    const userId = req.params._id;

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'user not found' });

    
    const isFollowed = user.follower.includes(followerId);
    

    const updateQuery = {};
    if (isFollowed) {
      updateQuery.$pull = { follower: followerId };
    } else {
      updateQuery.$push = { follower: followerId };
    }

    const updatedUser = await userModel.findByIdAndUpdate(userId, updateQuery, { new: true });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})
userRouter.post("/verify", async (req, res) => {
  const email = await userModel.findOne({email: req.body.email}) 
  if(!email) res.status(400).send("email not found!")
  else{
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
   send(req.body.email, otp)
 await modelOtp.create({otp:  otp })
   res.send(req.body.email)
  }
})
userRouter.post("/verify/otp", (req, res) => {

   const otp = modelOtp.findOne({otp: req.body.otp})
   if(!otp) res.status(400).send("invalid OTP number!")
    res.send("success")
}) 
userRouter.post("/verify/password", async (req,res) => {
    const user = await userModel.findOne({email: req.body.email})
    const salt = await bcrypt.genSalt(10)
  
   const hashPassword = await bcrypt.hash(req.body.password, salt)
   await userModel.findOneAndUpdate({email: req.body.email}, { 
     $set: {password: hashPassword}
   }, {new: true})
  await user.save()
  res.status(200).send("success")
})
userRouter.put("/edit-account/:_id", async (req, res) => {
    let user =  await userModel.findOne({
      _id: req.body._id
    })
    const isDesc = req.body.desc
   if(isDesc.length > 600) {
      return res.status(400).send("maximun description text is 600!")
   }
    let image = sanitize(req.body.image)
  if(!user) return res.status(400).send("error")
    const uploaded = await cloudinary.uploader.upload(image, {
      upload_preset: "unsigned_upload",
      public_id: `${req.body.username}`,
      allowed_formats: ["png", "jpg", "jpeg", "svg", "webp"],
      overwrite:true, invalidate: true
    })
  const salt = await bcrypt.genSalt(10)
    const imageUser = uploaded.url
   const hashPassword = await bcrypt.hash(sanitize(req.body.password), salt)
     const product = await postModel.updateMany({userId: req.body._id}, {
       $set: {
         usernamePost: req.body.username,
         userImage: imageUser,
       }
     })
     console.log(product)
     const user1 = await userModel.findOneAndUpdate(
       {_id: req.body._id},
      {
        $set: {
          image: imageUser,
          username: sanitize(req.body.username),
          desc: req.body.desc,
          password: hashPassword,
          email: req.body.email,
        }
      },
      { new: true }  // Trả về document mới sau khi cập nhật
    );
    user.image = uploaded.url
    user.username = sanitize(req.body.username)
    user.email = user1.email
     user.password = hashPassword
       user.desc = req.body.desc
       user._id = req.body._id
  const token = genAuthToken(user)
  res.status(200).send(token)

    await user.save()
    await user1.save()

})
userRouter.post("/search", async (req, res) => {
  try {
        const { search } = req.body;
        if (!search) return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });

        // Tìm kiếm bài post theo tiêu đề hoặc nội dung
        const posts = await postModel.find({
            $or: [
                { usernamePost: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } }
            ]
        });

        // Tìm kiếm người dùng theo tên hoặc username
        const users = await userModel.find({username: { $regex: search, $options: "i" }})
    res.status(200).json({post: posts, user: users });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
  }
});
userRouter.post("/friend", async (req, res) => {
  try{
    const { user1, user2, username1, image1, username2, image2  } = req.body
    const isFriend = await friend.findOne({user1, user2})
    const isNofi = await nofication.findOne({userGetId: user2, userPostId: user1, type: "friend request"})
   if(!isFriend) {
    const friend1 = new friend({
      user1,
      user2,
      username1,
      username2,
      image1,
      image2,
      type: "friend request",
      isFriend: false,
      createdAt: Date.now()
    })
    
     await friend1.save()
   }
   if(!isNofi) {
     const nofication1 = new nofication({
      userGetId: user2,
      userPostId: user1,
      username: username1,
      image: image1,
      message: " send to you a friend request!",
      type: "friend request",
      isRead: false,
      createdAt: Date.now()
    })
    await nofication1.save()
   } 
    
   res.status(200).json("success")
    
  } catch(err) {
    console.log(err)
  }
})

userRouter.post("/friend/reply", async (req, res) => {
  try{
    const { reply, user1, user2, username1, username2, image1, image2 } = req.body
    if(reply === "reject") {
      await friend.findOneAndDelete({user1, user2})
      await nofication.findOneAndDelete({userGetId: user2, userPostId: user1, type: "friend request"})
      return res.status(200).send("success")
    }
    const friend1 = await friend.findOneAndUpdate({user1, user2}, {$set: {isFriend: true, type: "friend"}}, {new: true})
    await nofication.findOneAndDelete({userGetId: user2, userPostId: user1, type: "friend request"})
  const isChat = await chatModel.findOne({
      $or: [
        { user1: user1, user2: user2 },
        { user1: user2, user2: user1 }
      ]
  })
  if(!isChat) {
    const chat = new chatModel({
     user1,
     user2,
     username1,
     username2,
     image1,
     image2,
     createdAt: Date.now()
    })
    await chat.save()
  }
    res.status(200).send("success")
  } catch(err) {
    console.log(err)
  }
})
userRouter.get("/friend/list", async (req, res) => { 
  try {
    const { userId, limit} = req.query;
    const friends = await friend.find({
      $and: [
        {
          $or: [
            { user1: userId },
            { user2: userId }
          ]
        },
        { type: "friend" }
      ]
    }).limit(limit)
    res.status(200).json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
})
userRouter.get("/friend/isFriend/:user1/:user2", async (req, res) => {
  try{
    const { user1, user2 } = req.params
    const isFriend = await friend.findOne({
        $or: [
          { user1: user1, user2: user2 },
          { user1: user2, user2: user1 }
        ]
      })
    if(!isFriend) {
      return res.status(200).json({type: "notFriend" })
    }
    if(isFriend.type === "friend request") {
      return res.status(200).json({type: "friend request"})
    }
    res.status(200).json({type: "friend"})
  } catch(err) {
    console.log(err)
  }
})
userRouter.delete("/friend/:user1/:user2/delete", async (req, res) => {
  try{
    const { user1, user2 } = req.params
    const isFriend = await friend.findOneAndDelete({
        $or: [
          { user1: user1, user2: user2 },
          { user1: user2, user2: user1 }
        ]
    })
    res.status(200).json("success")
  } catch(err) {
    console.log(err)
  }
})
userRouter.get("/chat", async (req, res) => { 
  try {
    const { userId} = req.query;
    const chat = await chatModel.find({
          $or: [
            { user1: userId },
            { user2: userId }
          ]
    })
    res.status(200).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
})
userRouter.get("/chat/:_id", async (req, res) => { 
  try {
    const { _id } = req.params;
    const chat = await chatModel.findOne({_id: _id})
    res.status(200).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
})
userRouter.post("/chat/message", async (req, res) => {
  try{
    const { roomId, userPost, image, username, media, type, message } = req.body
    let result = ""; 
    if(media) {
    const result1 = await cloudinary.uploader.upload(media, {
      resource_type: "auto",
      upload_preset: "unsigned_upload",
      public_id: Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000,
      overwrite: true
    })
     result = result1.secure_url
    }
    const message1 = new messages({
      roomId,
      userPost,
      username,
      message,
      image,
      media: result,
      type
    })
    await message1.save()
    
    res.status(200).send("success")
  } catch(err) {
    console.log(err)
  }
})
userRouter.get("/chat/message/:roomId", async (req, res) => {
  try{
    const { roomId } = req.params
    const message = await messages.find({roomId: roomId}).sort({createdAt: -1})
    res.status(200).json(message)
  } catch(err) {
    console.log(err)
  }
})
userRouter.put("/chat/message/edit/:_id", async (req, res) => {
  try{
    const { _id } = req.params
    const { message } = req.body
    const message1 = await messages.findByIdAndUpdate(_id, {$set: {message: message}}, {new: true})
    res.status(200).send("success")
  } catch(err) {
    console.log(err)
  }
})
userRouter.delete("/chat/message/delete/:_id", async (req,res) => {
  try{
    const { _id } = req.params
    const message = await messages.findByIdAndDelete(_id)
    
    res.status(200).send("success")
  } catch(err) {
    console.log(err)
  }
})
module.exports = userRouter