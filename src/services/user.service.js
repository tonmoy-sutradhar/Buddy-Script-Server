// user.service.js
const httpStatus = require("http-status");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendEmailVerification } = require("./email.service");

// ─── Create user (registration) ─────────────────────────────────────────────────
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const oneTimeCode =
    Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  // Send OTP for user & provider; admin accounts don't need email verification
  if (userBody.role === "user" || userBody.role === "provider") {
    sendEmailVerification(userBody.email, oneTimeCode);
  }

  // Initialise the correct sub-document based on role
  const extra = {};
  if (userBody.role === "provider") {
    extra.providerProfile = { approvalStatus: "pending" };
  } else if (userBody.role === "user") {
    extra.userProfile = {};
  }

  return User.create({ ...userBody, oneTimeCode, ...extra });
};

// ─── Query / list users ──────────────────────────────────────────────────────────
const queryUsers = async (filter, options) => {
  const query = {};
  for (const key of Object.keys(filter)) {
    if (["fullName", "email", "username"].includes(key) && filter[key] !== "") {
      query[key] = { $regex: filter[key], $options: "i" };
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }
  return User.paginate(query, options);
};

// ─── Getters ─────────────────────────────────────────────────────────────────────
const getUserById = async (id) => User.findById(id);

const getUserByEmail = async (email) => User.findOne({ email });

// ─── Generic update ───────────────────────────────────────────────────────────────
const updateUserById = async (userId, updateBody, files) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  if (files && files.length > 0) {
    updateBody.photo = files;
  } else {
    delete updateBody.photo;
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

// ─── Complete profile: USER (client) ─────────────────────────────────────────────
const completeUserProfile = async (userId, profileData, inBodyFiles = []) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (user.role !== "user") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only users can call this endpoint");
  }
  if (user.isProfileCompleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Profile already completed");
  }

  const {
    callingCode, phoneNumber,
    gender, age, heightInch, initialWeightKg,
    hasMedicalConditions, medicalConditionsDetails,
    takesMedicationsRegularly, medicationsDetails,
    hasPreviousInjuries, injuriesDetails,
    hasAllergies, allergiesDetails,
    primaryGoal,
  } = profileData;

  user.callingCode  = callingCode || user.callingCode;
  user.phoneNumber  = phoneNumber;
  user.userProfile  = {
    gender, age, heightInch, initialWeightKg,
    hasMedicalConditions,
    medicalConditionsDetails: hasMedicalConditions ? medicalConditionsDetails : null,
    takesMedicationsRegularly,
    medicationsDetails: takesMedicationsRegularly ? medicationsDetails : null,
    hasPreviousInjuries,
    injuriesDetails: hasPreviousInjuries ? injuriesDetails : null,
    hasAllergies,
    allergiesDetails: hasAllergies ? allergiesDetails : null,
    primaryGoal,
    inBodyDocuments: inBodyFiles,
  };
  user.isProfileCompleted = true;

  await user.save();
  return user;
};

// ─── Complete profile: PROVIDER ────────────────────────────────────────────────
const completeProviderProfile = async (
  userId,
  profileData,
  certificateImages = [],
  otherDocuments = []
) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (user.role !== "provider") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only providers can call this endpoint");
  }
  if (user.isProfileCompleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Profile already completed");
  }

  const {
    callingCode, phoneNumber,
    specialist, specialistOther,
    experienceYears, feePerSession,
    aboutMe,
  } = profileData;

  user.callingCode     = callingCode || user.callingCode;
  user.phoneNumber     = phoneNumber;
  user.providerProfile = {
    specialist,
    specialistOther: specialist === "other" ? specialistOther : null,
    experienceYears,
    feePerSession,
    certificateImages,
    otherDocuments,
    aboutMe,
    approvalStatus: "pending",   // goes to admin for review
    approvalNote:   null,
    approvedAt:     null,
  };
  user.isProfileCompleted = true;

  await user.save();
  return user;
};

// ─── Admin: approve or reject a provider ──────────────────────────────────────
const reviewProviderProfile = async (userId, { approvalStatus, approvalNote }) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (user.role !== "provider") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Target user is not a provider");
  }
  if (!user.isProfileCompleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Provider has not completed their profile yet");
  }

  user.providerProfile.approvalStatus = approvalStatus;
  user.providerProfile.approvalNote   = approvalNote || null;
  user.providerProfile.approvedAt     = approvalStatus === "approved" ? new Date() : null;

  // Optionally notify provider via email here:
  // await emailService.sendProviderApprovalEmail(user.email, approvalStatus, approvalNote);

  await user.save();
  return user;
};

// ─── Soft-delete re-activation (used in register flow) ───────────────────────
const isUpdateUser = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  const oneTimeCode =
    Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  if (updateBody.role === "user" || updateBody.role === "provider") {
    sendEmailVerification(updateBody.email, oneTimeCode);
  }

  Object.assign(user, updateBody, {
    isDeleted:            false,
    isSuspended:          false,
    isEmailVerified:      false,
    isResetPassword:      false,
    isPhoneNumberVerified:false,
    oneTimeCode,
  });
  await user.save();
  return user;
};

// ─── Hard delete ──────────────────────────────────────────────────────────────
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  await user.remove();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  isUpdateUser,
  completeUserProfile,
  completeProviderProfile,
  reviewProviderProfile,
};












// // user.service.js
// const httpStatus = require("http-status");
// const { User } = require("../models");
// const ApiError = require("../utils/ApiError");
// const { sendEmailVerification } = require("./email.service");
// const unlinkImages = require("../common/unlinkImage");

// const createUser = async (userBody) => {
//   if (await User.isEmailTaken(userBody.email)) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
//   }
//   const oneTimeCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

//   if (userBody.role === "user" || userBody.role === "admin") {

//     sendEmailVerification(userBody.email, oneTimeCode);
//   }
//   return User.create({ ...userBody, oneTimeCode });
// };



// const queryUsers = async (filter, options) => {
//   const query = {};

//   // Loop through each filter field and add conditions if they exist
//   for (const key of Object.keys(filter)) {
//     if (
//       (key === "fullName" || key === "email" || key === "username") &&
//       filter[key] !== ""
//     ) {
//       query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
//     } else if (filter[key] !== "") {
//       query[key] = filter[key];
//     }
//   }

//   const users = await User.paginate(query, options);

//   // Convert height and age to feet/inches here...

//   return users;
// };



// const getUserById = async (id) => {
//   return User.findById(id);
// };

// const getUserByEmail = async (email) => {
//   return User.findOne({ email });
// };

// const updateUserById = async (userId, updateBody, files) => {
//   const user = await getUserById(userId);

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
//   }

//   if (files && files.length > 0) {
//     updateBody.photo = files;
//   } else {
//     delete updateBody.photo; // remove the photo property from the updateBody if no new photo is provided
//   }

//   Object.assign(user, updateBody);
//   await user.save();
//   return user;
// };

// const deleteUserById = async (userId) => {
//   const user = await getUserById(userId);
//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }
//   await user.remove();
//   return user;
// };

// const isUpdateUser = async (userId, updateBody) => {
//   const user = await getUserById(userId);
//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const oneTimeCode =
//     Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

//   if (updateBody.role === "user" || updateBody.role === "admin") {
//     sendEmailVerification(updateBody.email, oneTimeCode);
//   }

//   Object.assign(user, updateBody, {
//     isDeleted: false,
//     isSuspended: false,
//     isEmailVerified: false,
//     isResetPassword: false,
//     isPhoneNumberVerified: false,
//     oneTimeCode: oneTimeCode,
//   });
//   await user.save();
//   return user;
// };

// module.exports = {
//   createUser,
//   queryUsers,
//   getUserById,
//   getUserByEmail,
//   updateUserById,
//   deleteUserById,
//   isUpdateUser
// };