const asyncHandler = require("express-async-handler");
const Comment = require("../models/commentModel");
const Report = require("../models/reportModel");
///////////////////////////////////////////////////////

//*               creating a comment
///////////////////////////////////////////////////////
const createComment = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const { answer } = req.body;
  if (!answer) {
    res.status(400).json({ msg: "answer field cannot be empty" });
  }
  const comment = await Comment.create({
    answer,
    commenter: req.user._id,
    questionId,
  });
  res.status(201).json(comment);
});

//*             get comments on specific question
///////////////////////////////////////////////////////////
const getComments = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const comments = await Comment.find({ questionId }).populate(
    "commenter",
    "name email image.filePath -_id"
  );
  res.status(200).json(comments);
});

//*                  get a single comment
////////////////////////////////////////////////////////////
//! Is it necessary???

// const getComment = asyncHandler(async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const comment = await Comment.findById(commentId)
//       .populate("commenter")
//       .populate("questionId");
//     if (!comment) {
//       return res.status(404).json(`no comment with id: ${commentId}`);
//     } else {
//       return res.status(200).json(comment);
//     }
//   } catch (error) {
//     res.status(500).json({ msg: error.message });
//   }
// });

//*                 delete a single comment
////////////////////////////////////////////////////////////

const deleteComment = asyncHandler(async (req, res) => {
  const { questionId, commentId } = req.params;
  const { _id, isAdmin } = req.user;
  const comment = await Comment.findById(commentId).populate(
    "commenter",
    "_id name isAdmin email"
  );
  if (!comment) return res.status(404).json(`no comment with id: ${commentId}`);

  if (questionId != comment.questionId.toString()) {
    res.status(500);
    throw new Error(
      `questionId in param and questionId in comment didn't match`
    );
  }

  //* validate question
  if (!(comment.questionId.toString() === questionId)) {
    throw new Error(`url questionId and comments questionID didn't match`);
  }
  if (_id.toString() === comment.commenter._id.toString() || isAdmin) {
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (isAdmin && !comment.commenter.isAdmin) {
      //* construct content deletion email
      const message = `
          <h2>Hello ${comment.commenter.name}</h2>
          <p>Your Comment has been removed by the Admin. </p>
          <p>Vai talai kehi vannu xa vane gayera admin lai van</p>
          <p>Aayenda hawa post garis vane tero account ni udaidinxa hai admin le</p>
          <p>Hos Gar!!!!</p>
          <p>Your Comment</p>
          <p>${deletedComment.answer}</p>
          <p>Xii chii xyaa</p>
          <p>IT-Hub</p>
        `;
      const subject = "Comment Removed By Admin";
      const send_to = comment.commenter.email;
      const sent_from = process.env.EMAIL_USER;
      try {
        await sendEmail(subject, message, send_to, sent_from);
        return res.status(200).json(deleteComment);
      } catch (error) {
        return res.status(500).json({ msg: error.message });
      }
    }

    return res.status(200).json({ msg: "Comment Deleted Successfully" });
  } else {
    return res
      .status(400)
      .json({ msg: "Not authorized to delete the the comment" });
  }
});

//*                 update a single comment
////////////////////////////////////////////////////////////

const updateComment = asyncHandler(async (req, res) => {
  const { questionId, commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json(`no comment with id: ${id}`);
  if (questionId != comment.questionId.toString()) {
    res.status(400);
    throw new Error(
      "questionId in param and questionId in comment didn't match"
    );
  }
  const { answer } = req.body;
  if (!answer) {
    res.status(400).json({ msg: "answer field cannot be empty" });
  }
  if (req.user._id.toString() === comment.commenter.toString()) {
    const Updatedcomment = await Comment.findByIdAndUpdate(
      commentId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    return res.status(200).json(Updatedcomment);
  } else {
    return res.status(400).json({ msg: "not authorized to delete comment" });
  }
});

//*             get all comment of a specific user
////////////////////////////////////////////////////////////

// const usersComment = asyncHandler(async (req, res) => {
//   const { _id } = req.user;
//   try {
//     const comments = await Comment.find({ commenter: _id });
//     if (!comments) {
//       return res.status(404).json({ msg: "comments not found" });
//     } else {
//       return res.status(200).json(comments);
//     }
//   } catch (error) {
//     res.status(500).json({ msg: error.message });
//   }
// });

//*         handle Report!!
/////////////////////////////////////////////////////////
const reportComment = asyncHandler(async (req, res) => {
  const { questionId, commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404);
    throw new Error(`no comment by id:${commentId}`);
  }

  if (questionId !== comment.questionId.toString()) {
    res.status(400);
    throw new Error(
      "question Id in param and questionId in comment.questionId didn't match"
    );
  }

  const { reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error("reason cannot be empty");
  }

  //* check if it has already been reported or not
  //todo: If it hasn't been reported create new report and also set the isReported flag of comment
  if (!comment.isReported) {
    await Report.create(
      { reportedOn: commentId, reasons: reason, count: 1 },
      asyncHandler(async (err, report) => {
        comment.isReported = true;
        await comment.save();
        res.status(200).json(report);
      })
    );
  } else {
    //todo: If it has been reported previously then just modify the previous report
    Report.findOne(
      { reportedOn: commentId },
      asyncHandler(async (err, report) => {
        const array = report.reasons.filter((e) => e == reason);
        if (array.length != 0) {
          report.count += 1;
        } else {
          report.count += 1;
          report.reasons.push(reason);
        }
        await report.save();
        res.status(200).json(report);
      })
    );
  }
});

//*                    Handle Likes!!
///////////////////////////////////////////////////////////////

const upvoteComment = asyncHandler(async (req, res) => {
  const { questionId, commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404);
    throw new Error(`No comment with id:${commentId}`);
  }
  if (questionId !== comment.questionId.toString()) {
    res.status(400);
    throw new Error(
      "question Id in params and questionId in comment.questionId didn't match"
    );
  }
  const { upvote } = req.body;

  if (typeof upvote != typeof true) {
    res.status(400);
    throw new Error("only boolean value allowed");
  }
  if (upvote) {
    comment.upvote += 1;
  } else {
    comment.upvote -= 1;
  }
  await comment.save();
  res.status(200);

  res.json(comment);
});

//* export modules

module.exports = {
  createComment,
  getComments,
  deleteComment,
  updateComment,
  upvoteComment,
  reportComment,
};
