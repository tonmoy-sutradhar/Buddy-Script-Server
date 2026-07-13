const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createPost = {
  body: Joi.object().keys({
    text: Joi.string().allow("").max(5000),
    visibility: Joi.string().valid("public", "private").default("public"),
  }),
};

const getFeed = {
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

module.exports = {
  createPost,
  getFeed,
  postIdParam,
};
