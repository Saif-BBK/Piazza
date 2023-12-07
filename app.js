const express = require("express");
const connectDB = require("./utils/dbConnector");
const auth = require("./routes/authRoute");
const post=require("./routes/postRoute")
const cors = require("cors");
const bodyParser = require("body-parser");
const userAuthenticate=require("./utils/userAuthentication")

const app = express();

app.use(cors());
app.use(bodyParser.json());

//Use Env variables
require("dotenv").config();

connectDB();

app.use("/health", (req, res) => {
  res.status(200).send("OK");
});

//Auth router
app.use("/piazza", auth);

//Post router
app.use("/piazza/post",userAuthenticate,post)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
