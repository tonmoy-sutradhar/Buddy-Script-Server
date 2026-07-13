const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createComment = {
  params: Joi.object().keys({
    postId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    text: Joi.string().required().trim().min(1).max(2000),
    parentCommentId: Joi.string().custom(objectId).allow(null),
  }),
};

const listQuery = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(50),
  }),
};

const postIdParam = {
  params: Joi.object().keys({
    postId: Joi.string().required().custom(objectId),
  }),
};

const commentIdParam = {
  params: Joi.object().keys({
    commentId: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  createComment,
  listQuery,
  postIdParam,
  commentIdParam,
};
