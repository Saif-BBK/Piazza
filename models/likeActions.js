const express = require("express");
const router = express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const bcrypt = require("bcryptjs");
const userValidation=require("../utils/validator")

//New user registration endpoint
router.post("/register", async (req, res) => {
  const { error } = userValidation(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ username });

    // Existing User
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash
    const hashedPassword = await argon2.hash(password);

    // Store User
    user = new User({ username, password: hashedPassword });
    await user.save();

    const payload = {
      user: { id: user.id, username: user.username, password: user.password },
    };
    jwt.sign(
      payload,
      process.env.SECRET_KEY,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//User Login endpoint
router.post("/login", async (req, res) => {
  const { error } = userValidation(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { username,email, password } = req.body;

  try {
    const user = await User.findOne({ username });

    // User not found
    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // passwords verify
    const isMatch = await argon2.verify(user.password, password);

    // Wrong credentials
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // JWT
    const payload = {
      user: { id: user.id, username: user.username, password: user.password },
    };
    jwt.sign(
      payload,
      process.env.SECRET_KEY,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
