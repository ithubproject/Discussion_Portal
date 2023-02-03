const router = require("express").Router({ mergeParams: true });
const protect = require("../middleWare/authMiddleware");
const {
  createComment,
  getComments,
  usersComment,
  deleteComment,
  updateComment,
  reportComment,
  upvoteComment,
} = require("../controllers/commentController");

// /discussion/:question/comment
// router.route("/:questionId/comment").get(getComments).post(createComment);

// router
//   .route("/:questionId/comment/:commentId")
//   .get(getComment)
//   .delete(deleteComment)
//   .patch(updateComment);

router.post("/comment", protect, createComment);
router.get("/comment", getComments);
router.delete("/comment/:commentId", protect, deleteComment);
router.patch("/comment/:commentId", protect, updateComment);
router.post("/comment/:commentId/report", protect, reportComment);
router.post("/comment/:commentId/upvote", protect, upvoteComment);

module.exports = router;
