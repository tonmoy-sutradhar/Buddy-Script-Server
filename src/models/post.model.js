// src/models/post.model.js
const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const postSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      url: { type: String, default: null },
      path: { type: String, default: null, private: true }, // server-only, used to unlink file on delete
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
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

postSchema.pre("validate", function (next) {
  if (!this.text && !this.image?.url) {
    return next(new Error("Post must contain text or an image"));
  }
  next();
});

postSchema.index({ visibility: 1, isDeleted: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

postSchema.plugin(toJSON);
postSchema.plugin(paginate);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
