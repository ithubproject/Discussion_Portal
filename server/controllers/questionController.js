const Question = require("../models/questionModel");
const asyncHandler = require("express-async-handler");
const sendEmail = require("../utils/sendEmail");
const Report = require("../models/reportModel");
const Comment = require("../models/commentModel");

//*                       create question
////////////////////////////////////////////////////////////////

const createQuestion = asyncHandler(async (req, res) => {
  const { question, tag } = req.body;

  if (!question) {
    res.status(400);
    throw new Error("question field cannot be empty!");
  }

  await Question.create(
    { question: question, tag: tag, questioner: req.user._id },
    (err, savedQuestion) => {
      if (err) {
        res.status(500);
        throw new Error("cannot create question");
      } else {
        res.status(200);
        res.json(savedQuestion);
      }
    }
  );
});

//*                              get questions
////////////////////////////////////////////////////////////////////

const getQuestions = asyncHandler(async (req, res) => {
  await Question.find()
    .populate("questioner", "name email image.filePath _id createdAt updatedAt")
    .exec((err, questions) => {
      if (err) {
        res.status(404);
        throw new Error("could not get questions");
      } else {
        res.status(201).json(questions);
      }
    });
});

//*                          get a single question
/////////////////////////////////////////////////////////////////////////

const getQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const question = await Question.findById(questionId)
    .populate("questioner", "_id name email image.filePath")
    .populate("comments");
  if (!question) {
    return res.status(404).json(`no question with id: ${questionId}`);
  } else {
    return res.status(200).json(question);
  }
});

//*                      delete a single question
/////////////////////////////////////////////////////////////////////////

const deleteQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const { _id, isAdmin } = req.user;
  const question = await Question.findById(questionId).populate(
    "questioner",
    "name _id isAdmin email"
  );
  if (!question) {
    return res.status(404).json({ msg: `no question with id: ${questionId}` });
  }

  if (_id.toString() === question.questioner._id.toString() || isAdmin) {
    const deletedQuestion = await Question.findByIdAndDelete(questionId);
    const deletedComments = await Comment.deleteMany({
      _id: deletedQuestion.comments,
    });

    if (isAdmin && !question.questioner.isAdmin) {
      //* construct content deletion email
      const message = `
          <h2>Hello ${question.questioner.name}</h2>
          <p>Your Question has been removed by the Admin. </p>
          <p>Vai talai kehi vannu xa vane gayera admin lai van</p>
          <p>Aayenda hawa post garis vane tero account ni udaidinxa hai admin le</p>
          <p>Hos Gar!!!!</p>
          <p>Your Question</p>
          <p>${deletedQuestion.question}</p>
          <p>Xii chii xyaa</p>
          <p>IT-Hub</p>
        `;
      const subject = "Question Removed By Admin";
      const send_to = question.questioner.email;
      const sent_from = process.env.EMAIL_USER;
      try {
        await sendEmail(subject, message, send_to, sent_from);
        return res
          .status(200)
          .json({ success: true, message: "mail sent to user" });
      } catch (error) {
        return res.status(500).json({ msg: error.message });
      }
    }
    return res.status(200).json(deletedQuestion);
  } else {
    return res
      .status(400)
      .json({ msg: "Not authorized to delete the question" });
  }
});

//*                        update single question
/////////////////////////////////////////////////////////////////////////

const updateQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const { _id } = req.user;
  const question = await Question.findById(questionId);
  if (!question) {
    return res.status(404).json({ msg: `no question with id: ${questionId}` });
  }
  if (_id.toString() === question.questioner.toString()) {
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    return res.status(200).json(updatedQuestion);
  } else {
    return res
      .status(400)
      .json({ msg: "not authenticated to update the question" });
  }
});

//*                 Get all questions of a current User
////////////////////////////////////////////////////////////////////////////

// //? where to put this module
// //! think carefully
// //? Maybe on profile controller maybe
// //? Maybe here why make new controller to fetch question again if it can be done here
// const getQuestionByUser = async (req, res) => {
//   try {
//     const questions = await Question.find({ questioner: req.user._id });
//     if (!questions) {
//       return res.status(404).json({ msg: "no questions by the user" });
//     }
//     return res.status(200).json(questions);
//   } catch (error) {
//     res.status(500).json({ msg: error.message });
//   }
// };

//*                         Handle Report!!
///////////////////////////////////////////////////////////////

const reportQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;

  const question = await Question.findById(questionId);
  if (!question) {
    res.status(404);
    throw new Error(`no question by id:${questionId}`);
  }

  const { reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error("reason cannot be empty");
  }

  //* check if it has already been reported or not
  //todo: If it hasn't been reported create new report and also set the isReported flag of question
  if (!question.isReported) {
    await Report.create(
      { reportedOn: questionId, reasons: reason, count: 1 },
      (err, report) => {
        if (err) throw new Error("failed to create report");
        else {
          question.isReported = true;
          question.save();
          res.status(200).json(report);
        }
      }
    );
  } else {
    //todo: If it has been reported previously then just modify the previous report
    Report.findOne(
      { reportedOn: questionId },
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

//*                         Handle Likes!!!
////////////////////////////////////////////////////////////////////

const upvoteQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const question = await Question.findById(questionId);
  if (!question) {
    res.status(404);
    throw new Error(`No question with id:${questionId}`);
  }
  const { upvote } = req.body;
  if (typeof upvote != typeof true) {
    res.status(400);
    throw new Error("only boolean value allowed");
  }
  if (upvote) {
    question.upvote += 1;
  } else {
    question.upvote -= 1;
  }
  await question.save();
  res.status(200);

  res.json(question);
});

//*                          export Modules
//////////////////////////////////////////////////////////////////////

module.exports = {
  createQuestion,
  getQuestions,
  getQuestion,
  deleteQuestion,
  updateQuestion,
  reportQuestion,
  upvoteQuestion,
};
