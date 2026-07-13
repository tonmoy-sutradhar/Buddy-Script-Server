const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const response = require("../config/response");
const { postService, likeService } = require("../services");

const createPost = catchAsync(async (req, res) => {
  const post = await postService.createPost(req.user.id, req.body, req.file);
  res.status(httpStatus.CREATED).json(
    response({
      message: "Post created",
      statusCode: httpStatus.CREATED,
      data: { post },
    }),
  );
});

const getFeed = catchAsync(async (req, res) => {
  const options = pick(req.query, ["page", "limit"]);
  const result = await postService.getFeed(req.user.id, options);
  res.status(httpStatus.OK).json(
    response({
      message: "Feed",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const getPost = catchAsync(async (req, res) => {
  const post = await postService.getPostById(req.params.postId, req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: "Post",
      statusCode: httpStatus.OK,
      data: { post },
    }),
  );
});

const deletePost = catchAsync(async (req, res) => {
  await postService.deletePost(req.params.postId, req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: "Post deleted",
      statusCode: httpStatus.OK,
      data: {},
    }),
  );
});

const toggleLike = catchAsync(async (req, res) => {
  const result = await likeService.toggleLike(
    "Post",
    req.params.postId,
    req.user.id,
  );
  res.status(httpStatus.OK).json(
    response({
      message: result.liked ? "Post liked" : "Post unliked",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const getLikers = catchAsync(async (req, res) => {
  const options = pick(req.query, ["page", "limit"]);
  const result = await likeService.getLikers(
    "Post",
    req.params.postId,
    options,
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Users who liked this post",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

module.exports = {
  createPost,
  getFeed,
  getPost,
  deletePost,
  toggleLike,
  getLikers,
};
