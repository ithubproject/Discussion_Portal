const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const { errorHandler } = require("./middleWare/errorMiddleWare");
const questionRoute = require("./routes/questionRoute");
const commentRoute = require("./routes/commentRoute");
const userRoute = require("./routes/userRoute");

mongoose.set("strictQuery", true);

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ credentials: true, origin: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/question", questionRoute);
app.use("/api/:questionId", commentRoute);
app.use("/api/users", userRoute);

//* Error Middleware
app.use(errorHandler);
//* connect to database and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server running on port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
