const httpStatus = require("http-status");
const { Comment, Post } = require("../models");
const ApiError = require("../utils/ApiError");
const likeService = require("./like.service");

const assertPostVisible = async (postId, userId) => {
  const post = await Post.findOne({ _id: postId, isDeleted: false });
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }
  if (
    post.visibility === "private" &&
    post.author.toString() !== String(userId)
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, "This post is private");
  }
  return post;
};

const createComment = async (userId, postId, { text, parentCommentId }) => {
  await assertPostVisible(postId, userId);

  let parentComment = null;
  if (parentCommentId) {
    parentComment = await Comment.findOne({
      _id: parentCommentId,
      isDeleted: false,
      post: postId,
    });
    if (!parentComment) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Comment being replied to was not found",
      );
    }
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    parentComment: parentCommentId || null,
    text,
  });

  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment.id, {
      $inc: { repliesCount: 1 },
    });
  }

  return comment.populate("author", "firstName lastName image");
};

const getComments = async (postId, userId, options) => {
  await assertPostVisible(postId, userId);

  const limit = Math.min(parseInt(options.limit, 10) || 10, 50);
  const page = parseInt(options.page, 10) || 1;
  const skip = (page - 1) * limit;
  const filter = { post: postId, parentComment: null, isDeleted: false };

  const [results, totalResults] = await Promise.all([
    Comment.find(filter)
      .sort("createdAt")
      .skip(skip)
      .limit(limit)
      .populate("author", "firstName lastName image"),
    Comment.countDocuments(filter),
  ]);

  const likedIds = await likeService.getLikedTargetIds(
    "Comment",
    results.map((c) => c._id),
    userId,
  );

  const enriched = results.map((c) => {
    const obj = c.toJSON();
    obj.isLiked = likedIds.has(c._id.toString());
    return obj;
  });

  return {
    results: enriched,
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
};

const getReplies = async (commentId, userId, options) => {
  const parent = await Comment.findOne({ _id: commentId, isDeleted: false });
  if (!parent) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }
  await assertPostVisible(parent.post, userId);

  const limit = Math.min(parseInt(options.limit, 10) || 10, 50);
  const page = parseInt(options.page, 10) || 1;
  const skip = (page - 1) * limit;
  const filter = { parentComment: commentId, isDeleted: false };

  const [results, totalResults] = await Promise.all([
    Comment.find(filter)
      .sort("createdAt")
      .skip(skip)
      .limit(limit)
      .populate("author", "firstName lastName image"),
    Comment.countDocuments(filter),
  ]);

  const likedIds = await likeService.getLikedTargetIds(
    "Comment",
    results.map((c) => c._id),
    userId,
  );

  const enriched = results.map((c) => {
    const obj = c.toJSON();
    obj.isLiked = likedIds.has(c._id.toString());
    return obj;
  });

  return {
    results: enriched,
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
};

const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }
  if (comment.author.toString() !== String(userId)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only delete your own comment",
    );
  }
  comment.isDeleted = true;
  await comment.save();

  await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $inc: { repliesCount: -1 },
    });
  }

  return comment;
};

module.exports = {
  createComment,
  getComments,
  getReplies,
  deleteComment,
};
