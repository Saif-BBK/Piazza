const express = require("express");
const router = express.Router();
const Comment = require("../models/comments");
const Post = require("../models/post");
const shortid = require("shortid");

// create post
router.post("/create", async (req, res) => {
  const { post, postTitle, postBody, postTopic, status, comments } = req.body;

  try {
    const newPost = new Post({
      postId: shortid.generate(),
      post,
      postTitle,
      postBody,
      postTopic,
      status,
      postOwner: req.user.username,
    });

    await newPost.save();

    if (comments && comments.length > 0) {
      const commentObjects = await Comment.insertMany(
        comments.map((comment) => ({ postId: newPost.postId, ...comment }))
      );

      newPost.comments = commentObjects.map((comment) => comment._id);
      await newPost.save();
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

//update post
router.put("/update", async (req, res) => {
  const { postId } = req.query;
  const { post, postTitle, postBody } = req.body;
  const currentUser = req.user.username;

  try {
    const existingPost = await Post.findOne({ postId });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found." });
    }
    console.log(currentUser + " "+existingPost.postOwner)
    if (existingPost.postOwner !== currentUser) {
      return res
        .status(403)
        .json({ error: "Unauthorized. You are not the owner of the post." });
    }

    if (existingPost.expiresAt < new Date()) {
      return res.status(403).json({ error: "Post expired. Cannot update." });
    }

    existingPost.post = post || existingPost.post;
    existingPost.postTitle = postTitle || existingPost.postTitle;
    existingPost.postBody = postBody || existingPost.postBody;

    await existingPost.save();

    res.status(200).json(existingPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// delete post
router.delete("/delete", async (req, res) => {
  const { postId } = req.query;

  try {
    const post = await Post.findOne({ postId });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (post.postOwner !== req.user.username) {
      return res
        .status(403)
        .json({ error: "Unauthorized. You are not the owner of the post." });
    }

    await Comment.deleteMany({ postId: postId });

    await Post.findOneAndDelete({ postId });
    res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

//get topic posts
router.get("/topic", async (req, res) => {
  const { topic } = req.query;

  try {
    let posts = await Post.find({ postTopic: topic });

    await Promise.all(
      posts.map(async (post) => {
        if (post.expiresAt && post.expiresAt < new Date()) {
          post.status = "Expired";
          await post.save();
        }
      })
    );

    posts = await Post.find({ postTopic: topic });

    posts = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ postId: post.postId });
        return { ...post._doc, comments };
      })
    );

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

//most active
router.get("/most-active-posts", async (req, res) => {
  try {
    const { topic } = req.query;

    if (!topic) {
      return res.status(400).json({ error: "Topic parameter is required." });
    }

    const mostActivePosts = await Post.aggregate([
      { $match: { postTopic: topic } },
      {
        $group: {
          _id: "$postTopic",
          mostLikedPost: { $max: { likes: "$numberOfLikes", post: "$$ROOT" } },
          mostDislikedPost: {
            $max: { dislikes: "$numberOfDislikes", post: "$$ROOT" },
          },
        },
      },

      {
        $project: {
          _id: 0,
          postTopic: "$_id",
          mostLikedPost: "$mostLikedPost.post",
          mostDislikedPost: "$mostDislikedPost.post",
        },
      },
    ]);

    res.status(200).json({ mostActivePosts: mostActivePosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/get-post/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findOne({ postId });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    let comments = [];

    // Check if the post has comments
    if (post.comments && post.comments.length > 0) {
      // Fetch comments only if they exist
      comments = await Comment.find({ postId: post.commentId });
    }

    // Parse comments if they are stored as strings
    const parsedComments = comments.map(comment => {
      try {
        return JSON.parse(comment);
      } catch (error) {
        console.error("Error parsing comment:", error);
        return comment;
      }
    });

    res.status(200).json({ post, comments: parsedComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});




router.get("/get-all-posts", async (req, res) => {
  try {
    const posts = await Post.find();

    let postsWithComments = [];

    // Fetch comments for each post
    if (posts && posts.length > 0) {
      postsWithComments = await Promise.all(
        posts.map(async (post) => {
          let comments = [];

          // Check if the post has comments
          if (post.comments && post.comments.length > 0) {
            // Fetch comments only if they exist
            comments = await Comment.find({ commentId: post.commentId });
          }

          return { post, comments };
        })
      );
    }

    res.status(200).json({ posts: postsWithComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/expiredTopicPosts", async (req, res) => {
  try {
    const { topic } = req.query;

    if (!topic) {
      return res.status(400).json({ message: "Topic parameter is required" });
    }

    const expiredTopicPosts = await Post.find({ postTopic: topic, status: "Expired" });

    const postsWithComments = await Promise.all(
      expiredTopicPosts.map(async (post) => {
        // Fetch comments for each post
        let comments = [];

        // Check if the post has comments
        if (post.comments && post.comments.length > 0) {
          // Fetch comments only if they exist
          comments = await Comment.find({ postId: post.commentId });
        }

        // Parse comments if they are stored as strings
        const parsedComments = comments.map((comment) => {
          try {
            return JSON.parse(comment);
          } catch (error) {
            console.error("Error parsing comment:", error);
            return comment;
          }
        });

        return { post, comments: parsedComments };
      })
    );

    res.status(200).json({ expiredTopicPosts: postsWithComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
