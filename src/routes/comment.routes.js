// src/routes/comment.routes.js
const express = require("express");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { commentValidation } = require("../validations");
const { commentController } = require("../controllers");

const router = express.Router();

router.get(
  "/:commentId/replies",
  auth(),
  validate({
    ...commentValidation.commentIdParam,
    ...commentValidation.listQuery,
  }),
  commentController.getReplies,
);

router.post(
  "/:commentId/like",
  auth(),
  validate(commentValidation.commentIdParam),
  commentController.toggleLike,
);
router.get(
  "/:commentId/likes",
  auth(),
  validate(commentValidation.commentIdParam),
  commentController.getLikers,
);
router.delete(
  "/:commentId",
  auth(),
  validate(commentValidation.commentIdParam),
  commentController.deleteComment,
);

module.exports = router;
