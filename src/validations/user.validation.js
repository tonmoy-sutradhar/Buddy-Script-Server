// user.validation.js
const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createUser = {
  body: Joi.object().keys({
    email:    Joi.string().required().email(),
    password: Joi.string().required(),
    name:     Joi.string().required(),
    role:     Joi.string().required().valid("user", "provider", "admin"),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name:   Joi.string(),
    role:   Joi.string(),
    sortBy: Joi.string(),
    limit:  Joi.number().integer(),
    page:   Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  body: Joi.object().keys({
    firstName:   Joi.string().allow("", null),
    lastName:    Joi.string().allow("", null),
    fullName:    Joi.string().allow("", null),
    phoneNumber: Joi.string().allow("", null),
    callingCode: Joi.string().allow("", null),
    nidNumber:   Joi.string().allow("", null),
    dateOfBirth: Joi.string().allow("", null),
    address:     Joi.string().allow("", null),
  }),
};

// ─── Complete Profile: User (client) ───────────────────────────────────────────
const completeUserProfile = {
  body: Joi.object().keys({
    callingCode:               Joi.string().allow("", null),
    phoneNumber:               Joi.string().required(),
    gender:                    Joi.string().valid("Male", "Female", "Other").required(),
    age:                       Joi.number().integer().min(1).max(120).required(),
    heightInch:                Joi.number().min(0).required(),
    initialWeightKg:           Joi.number().min(0).required(),
    hasMedicalConditions:      Joi.boolean().required(),
    medicalConditionsDetails:  Joi.string().allow("", null),
    takesMedicationsRegularly: Joi.boolean().required(),
    medicationsDetails:        Joi.string().allow("", null),
    hasPreviousInjuries:       Joi.boolean().required(),
    injuriesDetails:           Joi.string().allow("", null),
    hasAllergies:              Joi.boolean().required(),
    allergiesDetails:          Joi.string().allow("", null),
    primaryGoal:               Joi.string()
      .valid("Weight Loss", "Weight Gain", "Muscle Gain", "Fitness", "Health Maintenance")
      .required(),
  }),
};

// ─── Complete Profile: Provider ─────────────────────────────────────────────────
const completeProviderProfile = {
  body: Joi.object().keys({
    callingCode:     Joi.string().allow("", null),
    phoneNumber:     Joi.string().required(),
    specialist:      Joi.string()
      .valid(
        "Nutritionist",
        "Fitness Coach",
        "Physical Therapist",
        "Behavioral Therapist",
        "Obesity Physician",
        "Nutrition Consultant",
        "other"
      )
      .required(),
    specialistOther: Joi.when("specialist", {
      is:        "other",
      then:      Joi.string().required(),
      otherwise: Joi.string().allow("", null),
    }),
    experienceYears: Joi.number().integer().min(0).required(),
    feePerSession:   Joi.number().min(0).required(),
    aboutMe:         Joi.string().allow("", null),
  }),
};

// ─── Admin: approve / reject provider ──────────────────────────────────────────
const reviewProviderProfile = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    approvalStatus: Joi.string().valid("approved", "rejected").required(),
    approvalNote:   Joi.string().allow("", null),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  completeUserProfile,
  completeProviderProfile,
  reviewProviderProfile,
  deleteUser,
};







// // user.validation.js
// const Joi = require("joi");
// const { password, objectId } = require("./custom.validation");

// const createUser = {
//   body: Joi.object().keys({
//     email: Joi.string().required().email(),
//     password: Joi.string().required().custom(password),
//     name: Joi.string().required(),
//     role: Joi.string().required().valid("user", "admin"),
//   }),
// };

// const getUsers = {
//   query: Joi.object().keys({
//     name: Joi.string(),
//     role: Joi.string(),
//     sortBy: Joi.string(),
//     limit: Joi.number().integer(),
//     page: Joi.number().integer(),
//   }),
// };

// const getUser = {
//   params: Joi.object().keys({
//     userId: Joi.string().custom(objectId),
//   }),
// };

// const updateUser = {
//   file: Joi.object().keys({
//     filename: Joi.string().required(),
//   }),
//   body: Joi.object()
//     .keys({
//       firstName: Joi.string(),
//       lastName: Joi.string(),
//       fullName: Joi.string(),
//       // email: Joi.string().email(),
//       phoneNumber: Joi.string(),
//       callingCode: Joi.string(),
//       nidNumber: Joi.string(),
//       dataOfBirth: Joi.string(),
//       address: Joi.string(),
//     })
// };

// const deleteUser = {
//   params: Joi.object().keys({
//     userId: Joi.string().custom(objectId),
//   }),
// };


// const getHome = {

// };

// module.exports = {
//   getHome,
//   createUser,
//   getUsers,
//   getUser,
//   updateUser,
//   deleteUser,
// };
