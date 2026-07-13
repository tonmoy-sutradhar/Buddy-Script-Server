const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const likeSchema = mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["Post", "Comment"],
      required: true,
    },
    targetId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      refPath: "targetType",
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// One like per user per target — makes "did I like this" and toggling O(1).
likeSchema.index({ targetType: 1, targetId: 1, user: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

likeSchema.plugin(toJSON);

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
