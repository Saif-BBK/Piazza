const mongoose = require("mongoose");

const likeActionSchema = new mongoose.Schema({
  likeActionsId: {
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
  status: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("LikeAction", likeActionSchema);
