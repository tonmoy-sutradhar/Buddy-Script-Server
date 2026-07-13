const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const commentSchema = mongoose.Schema(
  {
    post: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    // null => top-level comment. set => this doc is a reply to that comment.
    parentComment: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });

commentSchema.plugin(toJSON);
commentSchema.plugin(paginate);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
