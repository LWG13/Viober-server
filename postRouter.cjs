const mongoose = require("mongoose")
const express = require("express")
const cloudinary = require("./cloudinary.cjs")
const sanitize = require("mongo-sanitize")
const postRouter = express.Router()
const { ObjectId } = require('mongodb')
const postModel = require("./postModel.cjs")
const commentModel = require("./commentModel.cjs")
const favModel = require("./favModel.cjs")
const nofication = require("./noficationModel.cjs")


postRouter.post("/create", async (req, res) => {
  try {
    const { userId, usernamePost, content, media, type, userImage} = req.body
    
    let media1 = '';
    if (media) {
      // Upload to Cloudinary only if media exists
      const result = await cloudinary.uploader.upload(media, {
        resource_type: "auto",
        upload_preset: "unsigned_upload",
        public_id: Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000,
        overwrite: true
      })
      media1 = result.secure_url;
    }

    const post = new postModel({
      userId,
      usernamePost,
      userImage,
      content,
      type,
      media: media1
    })
    
    await post.save()
    res.status(200).json({ message: "success", post })
  } catch (error) {
    console.error('Error creating post:', error)
    res.status(500).json({ message: "Error creating post", error: error.message })
  }
})
postRouter.get("/posts", async (req, res) => {
    try{
  const page = req.query.page || 0
  const limitPost = 5
  const samples = await postModel.aggregate([
      { $sample: { size: 5 } }
    ]);

    // Áp dụng skip và limit trong ứng dụng
    const post = samples.slice(page, page + limitPost);

    res.json(post)
} catch(err) {
   console.log(err)
    }
})
postRouter.get("/posts/user/:userId", async (req, res) => {
  try{
    const post = await postModel.find({ userId: req.params.userId }).lean()
    res.json(post)
  } catch(err) {
    console.log(err)
  }
})
postRouter.delete("/posts/delete/:_id", async (req, res) => {
  try{
   const postId = req.params._id 
   const post = await postModel.deleteOne({ _id: postId})
   res.status(200).json(post)
  } catch(err) {
    console.log(err)
  }
})
postRouter.put("/posts/put/:_id", async (req, res) => {
  try{
    const postId = req.params._id
    const post = await postModel.findByIdAndUpdate(postId, {
      $set: {
        content: req.body.content
      }
    }, { new: true })
    
    res.status(200).json(post)
  } catch(err) {
    console.log(err)
  }
})
postRouter.get("/posts/watch", async (req,res) => {
  try{
    const page = req.query.page || 0
    const limitPost = 5
    const post = await postModel.aggregate([
      { $match: { type: "video" } }, { $sample: { size: 5 } } 
    ]);
    const post1 = post.slice(page, page + limitPost);
    
    res.json(post1)
  } catch(err) {
    console.log(err)
  }
})
postRouter.post("/posts/comment", async (req, res) => {
  const { userId, usernamePost, userImage, content, type, media, postId, userGetId} = req.body
  let media1 = '';
    if (media) {
      // Upload to Cloudinary only if media exists
      const result = await cloudinary.uploader.upload(media, {
        resource_type: "auto",
        upload_preset: "unsigned_upload",
        public_id: Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000,
        overwrite: true
      })
      media1 = result.secure_url;
    }
  const comment = new commentModel({
    userId: userId,
    usernamePost: usernamePost,
    userImage: userImage,
    content: content,
    type: type,
    media: media1,
    postId: postId
  })
  await comment.save()
  const isNofi = await nofication.findOne({userPostId: userId, postId: postId, type: "comment"})
 if(!isNofi) {
  const notification = new nofication({
   userGetId: userGetId,
   userPostId: userId,
   postId: postId,
   message: "Your post have 1 comment!",
   type: "comment",
   isRead: false,
   createdAt: Date.now()
  })
  await notification.save()
 }
  res.send("success")
})
postRouter.delete("/posts/comment/delete/:_id" , async (req,res) => {
   try {
   const deleteComment = await commentModel.findOneAndDelete({ _id: req.params._id})
  const comment = await commentModel.findOne({ _id: req.params.commentId });
if (!comment) {
    return res.status(404).json({ message: 'Không tìm thấy bình luận' });
}

await comment.deleteOne(); // Xóa trực tiếp document
     res.status(200).json(comment);
 
   } catch (error) {
    res.status(500).json({ message: error.message });
   }
})
postRouter.put("/posts/comment/reply/delete", async (req, res) => {
  try {
    const { commentId, replyId } = req.body;

    const updatedComment = await commentModel.findByIdAndUpdate(
      commentId,
      { $pull: { replies: { _id: replyId } } },
      { new: true }
    );

    
      res.status(200).json(updatedComment);
     res.status(200).send("succes")

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

postRouter.get("/posts/comment/:postId", async (req, res) => {
  try{
    const id = new ObjectId(req.params.postId)
    const comment = await commentModel.find({postId: id})
    res.json(comment)
    
  } catch(err){
    console.log(err)
  }
})
postRouter.get("/posts/user/:userId", async (req, res) => {
 try{
  const userId = req.params.userId
  const post = await postModel.find({userId}).lean()
  res.json(post)
 } catch(err) {
   console.log(err)
 }
})
postRouter.get("/posts/:_id", async (req, res) => {
 try{
  const id = req.params._id
  const post = await postModel.findOne({_id: id})
  res.json(post)
 } catch(err) {
   console.log(err)
 }
})

postRouter.put('/dislike/:_id', async (req, res) => {
  try {
    const userId  = req.body.userId;
    const postId = req.params._id;

    const post = await postModel.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Nếu user đã dislike rồi thì bỏ dislike, nếu chưa dislike thì thêm dislike và bỏ like (nếu có)
    const isLiked = post.likes.includes(userId);
    const isDisliked = post.dislikes.includes(userId);

    const updateQuery = {};
    if (isDisliked) {
      updateQuery.$pull = { dislikes: userId };
    } else {
      updateQuery.$push = { dislikes: userId };
      if (isLiked) updateQuery.$pull = { ...updateQuery.$pull, likes: userId };
    }

    const updatedPost = await postModel.findByIdAndUpdate(postId, updateQuery, { new: true });

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
postRouter.put('/like/:_id',  async (req, res) => {
  try {
    const userId  = req.body.userId;
    const userGetId = req.body.userGetId
    const postId = req.params._id;

    const post = await postModel.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Nếu user đã like rồi thì bỏ like, nếu chưa like thì thêm like và bỏ dislike (nếu có)
    const isLiked = post.likes.includes(userId);
    const isDisliked = post.dislikes.includes(userId);

    const updateQuery = {};
    if (isLiked) {
      updateQuery.$pull = { likes: userId };
    } else {
      updateQuery.$push = { likes: userId };
      if (isDisliked) updateQuery.$pull = { ...updateQuery.$pull, dislikes: userId };
    }

    const updatedPost = await postModel.findByIdAndUpdate(postId, updateQuery, { new: true });
  const isNofi = await nofication.findOne({userPostId: userId, postId: postId})
  if(userGetId && !isNofi) {
   const notification = new nofication({
   userGetId: userGetId,
   userPostId: userId,
   postId: postId,
   message: "Your post have 1 like!",
   type: "like",
   isRead: false,
   createdAt: Date.now()
  })
  await notification.save()
  } 
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
postRouter.get("/nofication/:userGetId", async (req, res) => {
   const nofiication = await nofication.find({userGetId: req.params.userGetId})
   res.json(nofiication)
})
postRouter.get("/nofication/:userGetId/isRead", async (req, res) => {
   const nofiication = await nofication.find({userGetId: req.params.userGetId, isRead: false})
   res.json(nofiication)
})
postRouter.put("/nofication/:_id", async (req,res) => {
  try {
    const id = req.params._id
    const nofitcation = await nofication.findByIdAndUpdate(id, {$set: {isRead: true}}, {new: true})
    res.status(200).json(nofitcation)
    
  } catch(err) {
    console.log(err)
  }
})
postRouter.put("/comment/reply/:_id", async (req, res) => {
  try {
    
    const { userId, userImage, usernamePost, content, _id} = req.body;

    const updatedComment = await commentModel.findByIdAndUpdate(
      _id,
      { $push: { replies: { userId, usernamePost, userImage, content } } },
      { new: true }
    );

    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
postRouter.post("/fav", async (req, res) => {
  try {
    const { postId, userFavId, usernamePost, userImage, content, type, media } = req.body;
    if (!userFavId) {
      return res.status(400).json({ error: "userFavId is required" });
    }

    const post = await favModel.findOne({ postId });
    if (post) {
      await favModel.findOneAndDelete({ postId });
      await postModel.findByIdAndUpdate(
        postId,
        { $pull: { favs: userFavId } },
        { new: true }
      );
      return res.status(200).json({ message: "Favorite removed" });
    }

    const fav = new favModel({
      postId,
      userFavId,
      usernamePost,
      userImage,
      content,
      type,
      media,
    
    });

    await postModel.findByIdAndUpdate(
      postId,
      { $push: { favs: userFavId } },
      { new: true }
    );
    
    await fav.save();
    res.status(200).json({ message: "Favorite added" });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
postRouter.get("/fav/:userFavId", async (req,res) => {
  try{
   const userFavId = req.params.userFavId
   const fav = await favModel.find({ userFavId }).lean()
    res.status(200).json(fav)
  } catch(err) {
    console.log(err)
  }
})
module.exports = postRouter