const express = require("express");
const connectDB = require("./utils/dbConnector");
const auth = require("./routes/authRoute");
const post=require("./routes/postRoute")
const comment=require("./routes/commentRoute")
const like=require("./routes/likeActionRoute")
const cors = require("cors");
const bodyParser = require("body-parser");
const userAuthenticate=require("./utils/userAuthentication")

const app = express();

app.use(cors());
app.use(bodyParser.json());

//Use Env variables
require("dotenv").config();

connectDB();

app.use("/health",userAuthenticate, (req, res) => {
  res.status(200).send("OK");
});

//Auth router
app.use("/piazza", auth);

//Post router
app.use("/piazza/post",userAuthenticate,post)

//Comment router
app.use("/piazza/comment",userAuthenticate,comment)

//Like router
app.use("/piazza/likeAction",userAuthenticate,like)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
