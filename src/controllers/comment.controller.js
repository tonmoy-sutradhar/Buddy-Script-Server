const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const response = require("../config/response");
const { commentService, likeService } = require("../services");

const createComment = catchAsync(async (req, res) => {
  const comment = await commentService.createComment(
    req.user.id,
    req.params.postId,
    req.body,
  );
  res.status(httpStatus.CREATED).json(
    response({
      message: req.body.parentCommentId ? "Reply added" : "Comment added",
      statusCode: httpStatus.CREATED,
      data: { comment },
    }),
  );
});

const getComments = catchAsync(async (req, res) => {
  const options = pick(req.query, ["page", "limit"]);
  const result = await commentService.getComments(
    req.params.postId,
    req.user.id,
    options,
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Comments",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const getReplies = catchAsync(async (req, res) => {
  const options = pick(req.query, ["page", "limit"]);
  const result = await commentService.getReplies(
    req.params.commentId,
    req.user.id,
    options,
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Replies",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const deleteComment = catchAsync(async (req, res) => {
  await commentService.deleteComment(req.params.commentId, req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: "Comment deleted",
      statusCode: httpStatus.OK,
      data: {},
    }),
  );
});

const toggleLike = catchAsync(async (req, res) => {
  const result = await likeService.toggleLike(
    "Comment",
    req.params.commentId,
    req.user.id,
  );
  res.status(httpStatus.OK).json(
    response({
      message: result.liked ? "Comment liked" : "Comment unliked",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const getLikers = catchAsync(async (req, res) => {
  const options = pick(req.query, ["page", "limit"]);
  const result = await likeService.getLikers(
    "Comment",
    req.params.commentId,
    options,
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Users who liked this comment",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

module.exports = {
  createComment,
  getComments,
  getReplies,
  deleteComment,
  toggleLike,
  getLikers,
};
