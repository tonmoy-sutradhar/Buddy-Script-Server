const httpStatus = require("http-status");
const { Like, Post, Comment } = require("../models");
const ApiError = require("../utils/ApiError");

const MODEL_MAP = { Post, Comment };

/**
 * Toggle a like on a Post or Comment (a reply is stored as a Comment too).
 * Uses the unique (targetType, targetId, user) index to guarantee a user
 * can never double-like the same target, and keeps a denormalized
 * likesCount on the target in sync via an atomic $inc.
 */
const toggleLike = async (targetType, targetId, userId) => {
  const Model = MODEL_MAP[targetType];
  if (!Model) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid target type");
  }

  const target = await Model.findOne({
    _id: targetId,
    isDeleted: { $ne: true },
  });
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, `${targetType} not found`);
  }

  const existingLike = await Like.findOne({
    targetType,
    targetId,
    user: userId,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    await Model.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
    return { liked: false };
  }

  try {
    await Like.create({ targetType, targetId, user: userId });
  } catch (err) {
    // race condition safety net — unique index rejects a concurrent double-like
    if (err.code === 11000) {
      return { liked: true };
    }
    throw err;
  }
  await Model.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
  return { liked: true };
};

const getLikers = async (targetType, targetId, options) => {
  const limit = Math.min(parseInt(options.limit, 10) || 20, 50);
  const page = parseInt(options.page, 10) || 1;
  const skip = (page - 1) * limit;

  const [results, totalResults] = await Promise.all([
    Like.find({ targetType, targetId })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .populate("user", "firstName lastName image"),
    Like.countDocuments({ targetType, targetId }),
  ]);

  return {
    results: results.map((l) => l.user),
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
};

/**
 * Given a list of target ids and a user, return a Set of the ids that
 * user has liked — one query instead of N, used to stamp isLiked on
 * a page of feed results.
 */
const getLikedTargetIds = async (targetType, targetIds, userId) => {
  if (!userId || targetIds.length === 0) return new Set();
  const likes = await Like.find({
    targetType,
    targetId: { $in: targetIds },
    user: userId,
  }).select("targetId");
  return new Set(likes.map((l) => l.targetId.toString()));
};

module.exports = {
  toggleLike,
  getLikers,
  getLikedTargetIds,
};
