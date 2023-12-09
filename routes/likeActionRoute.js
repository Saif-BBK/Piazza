const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const LikeActions = require("../models/likeActions");
const shortid = require("shortid");

// Endpoint to like a post
router.post("/like-post", async (req, res) => {
  try {
    const { postId } = req.body;
    const username = req.user.username;

    console.log(username)

    const post = await Post.findOne({ postId });

    if (post.expiresAt < new Date()) {
      return res.status(403).json({ error: "Post expired. Cannot update." });
    }

    if (post.postOwner == username) {
      return res.status(400).json({ error: "Post Owner cannot like the post" });
    }

    
    // Check if the user has already liked the post
    const existingLike = await LikeActions.findOne({
      postId,
      username,
      status: "like",
    });

    if (existingLike) {
      return res
        .status(400)
        .json({ error: "You have already liked this post." });
    }

    // Check if the user has previously disliked the post and update accordingly
    const existingDislike = await LikeActions.findOneAndDelete({
      postId,
      username,
      status: "dislike",
    });

    // Create a new like action
    const like = new LikeActions({
      likeActionsId: shortid.generate(),
      postId,
      username,
      status: "like",
    });

    // Save the like action
    await like.save();

    // Update the post's like count
    await Post.updateOne(
      { postId },
      { $inc: { numberOfLikes: 1, numberOfDislikes: existingDislike ? -1 : 0 } }
    );

    const updatedPost=await Post.findOne({ postId })
    res.status(201).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Endpoint to dislike a post
router.post("/dislike-post", async (req, res) => {
  try {
    const { postId } = req.body;
    const username = req.user.username;

    const post = await Post.findOne({ postId });

    if (post.expiresAt < new Date()) {
      return res.status(403).json({ error: "Post expired. Cannot update." });
    }

    if (post.postOwner == username) {
      return res.status(400).json({ error: "Post Owner cannot like the post" });
    }
    // Check if the user has already disliked the post
    const existingDislike = await LikeActions.findOne({
      postId,
      username,
      status: "dislike",
    });

    if (existingDislike) {
      return res
        .status(400)
        .json({ error: "You have already disliked this post." });
    }

    // Check if the user has previously liked the post and update accordingly
    const existingLike = await LikeActions.findOneAndDelete({
      postId,
      username,
      status: "like",
    });

    // Create a new dislike action
    const dislike = new LikeActions({
      likeActionsId: shortid.generate(),
      postId,
      username,
      status: "dislike",
    });

    // Save the dislike action
    await dislike.save();

    // Update the post's like count
    await Post.updateOne(
      { postId },
      { $inc: { numberOfLikes: existingLike ? -1 : 0, numberOfDislikes: 1 } }
    );

    const updatedPost=await Post.findOne({ postId })
    res.status(201).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
