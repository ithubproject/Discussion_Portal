const mongoose = require("mongoose");

module.exports = {};

const questionSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "query cannot be empty"],
    },
    tag: [String],
    upvote: {
      type: Number,
      default: 0,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    questioner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "there should be user who posts the question"],
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
