const httpStatus = require("http-status");
const { Post } = require("../models");
const ApiError = require("../utils/ApiError");
const likeService = require("./like.service");

const createPost = async (userId, postBody, file) => {
  const doc = {
    author: userId,
    text: postBody.text || "",
    visibility: postBody.visibility || "public",
  };
  if (file) {
    doc.image = { url: `/uploads/posts/${file.filename}`, path: file.path };
  }
  const post = await Post.create(doc);
  return post.populate("author", "firstName lastName image");
};

/**
 * Feed: everyone's public posts + the viewer's own private posts, newest first.
 */
const getFeed = async (userId, options) => {
  const limit = Math.min(parseInt(options.limit, 10) || 10, 50);
  const page = parseInt(options.page, 10) || 1;
  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: false,
    $or: [{ visibility: "public" }, { visibility: "private", author: userId }],
  };

  const [results, totalResults] = await Promise.all([
    Post.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .populate("author", "firstName lastName image"),
    Post.countDocuments(filter),
  ]);

  const likedIds = await likeService.getLikedTargetIds(
    "Post",
    results.map((p) => p._id),
    userId,
  );

  const enriched = results.map((post) => {
    const obj = post.toJSON();
    obj.isLiked = likedIds.has(post._id.toString());
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

const getPostById = async (postId, userId) => {
  const post = await Post.findOne({ _id: postId, isDeleted: false }).populate(
    "author",
    "firstName lastName image",
  );
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }
  if (post.visibility === "private" && post.author.id !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, "This post is private");
  }
  const likedIds = await likeService.getLikedTargetIds(
    "Post",
    [post._id],
    userId,
  );
  const obj = post.toJSON();
  obj.isLiked = likedIds.has(post._id.toString());
  return obj;
};

const deletePost = async (postId, userId) => {
  const post = await Post.findOne({ _id: postId, isDeleted: false });
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }
  if (post.author.toString() !== String(userId)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only delete your own posts",
    );
  }
  post.isDeleted = true;
  await post.save();
  return post;
};

module.exports = {
  createPost,
  getFeed,
  getPostById,
  deletePost,
};
