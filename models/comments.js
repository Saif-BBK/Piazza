const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  commentId: {
    type: String,
    required:true
  },
  postId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Comment", commentSchema);
