const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postId: {
    type: String,
    unique: true,
  },
  post: {
    type: String,
    required: true,
  },
  postTitle: {
    type: String,
    required: true,
  },
  postTopic: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 60 * 60 * 1000, // 5 minutes from now
  },
  postBody: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  postOwner: {
    type: String,
    required: true,
  },
  numberOfLikes: {
    type: Number,
    default: 0,
  },
  numberOfDislikes: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      type: String,
    },
  ],
  likeActions:{
    type:String
  }
});

module.exports = mongoose.model("Post", postSchema);
