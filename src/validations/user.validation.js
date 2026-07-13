const Joi = require("joi");

const updateUser = {
  body: Joi.object().keys({
    firstName: Joi.string(),
    lastName: Joi.string(),
  }),
};

module.exports = {
  updateUser,
};
