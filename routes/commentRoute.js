const express = require("express");
const router = express.Router();
const Comment = require("../models/comments");
const Post = require("../models/post");
const shortid = require("shortid");

// Endpoint for adding a comment to a post
router.post("/add-comment", async (req, res) => {
  try {
    const { postId, comment } = req.body;

    // Check if the post exists
    const post = await Post.findOne({ postId });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (post.expiresAt < new Date()) {
      return res.status(403).json({ error: "Post expired. Cannot update." });
    }
    // Create a new comment
    const newComment = new Comment({
      commentId: shortid.generate(),
      postId,
      username: req.user.username,
      comment,
    });

    // Save the comment
    await newComment.save();

    // Update the post with the new comment
    post.comments.push(newComment);

    // Update the commentId in the post
    post.commentId = newComment.commentId;

    await post.save();

    res.status(201).json({ message: "Comment added successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
