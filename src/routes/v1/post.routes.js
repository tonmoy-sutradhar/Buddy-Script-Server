const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const { postValidation, commentValidation } = require("../../validations");
const { postController, commentController } = require("../../controllers");
const fileUpload = require("../../middlewares/fileUpload");

const uploadPosts = fileUpload("./public/uploads/posts");

const router = express.Router();

router
  .route("/")
  .post(
    auth(),
    uploadPosts.single("image"),
    validate(postValidation.createPost),
    postController.createPost,
  )
  .get(auth(), validate(postValidation.getFeed), postController.getFeed);

router
  .route("/:postId")
  .get(auth(), validate(postValidation.postIdParam), postController.getPost)
  .delete(
    auth(),
    validate(postValidation.postIdParam),
    postController.deletePost,
  );

router.post(
  "/:postId/like",
  auth(),
  validate(postValidation.postIdParam),
  postController.toggleLike,
);
router.get(
  "/:postId/likes",
  auth(),
  validate(postValidation.postIdParam),
  postController.getLikers,
);

// Comments live under their post for creation/listing (a reply is created here too,
// just pass parentCommentId in the body)
router
  .route("/:postId/comments")
  .post(
    auth(),
    validate(commentValidation.createComment),
    commentController.createComment,
  )
  .get(
    auth(),
    validate({
      ...commentValidation.postIdParam,
      ...commentValidation.listQuery,
    }),
    commentController.getComments,
  );

module.exports = router;
