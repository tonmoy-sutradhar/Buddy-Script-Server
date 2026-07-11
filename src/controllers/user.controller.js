// user.controller.js
const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { userService } = require("../services");

// ─── Admin: list all users ──────────────────────────────────────────────────────
const getUsers = catchAsync(async (req, res) => {
  const filter  = pick(req.query, ["name", "role", "gender", "approvalStatus"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result  = await userService.queryUsers(filter, options);
  res.status(httpStatus.OK).json(
    response({ message: "All Users", status: "OK", statusCode: httpStatus.OK, data: result })
  );
});

// ─── Logged-in user: get own profile ───────────────────────────────────────────
const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  if (!user)           throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (user.isDeleted)  throw new ApiError(httpStatus.NOT_FOUND, "Account is deleted");
  if (user.isBlocked)  throw new ApiError(httpStatus.FORBIDDEN, "Account is blocked");

  res.status(httpStatus.OK).json(
    response({ message: "User Profile", status: "OK", statusCode: httpStatus.OK, data: { user } })
  );
});

// ─── Admin: get any user ────────────────────────────────────────────────────────
const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  res.status(httpStatus.OK).json(
    response({ message: "User", status: "OK", statusCode: httpStatus.OK, data: user })
  );
});

// ─── Logged-in user: update own basic profile ───────────────────────────────────
const updateProfile = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.image = `/uploads/users/${req.file.filename}`;
  }
  if (!req.body.fullName && (req.body.firstName || req.body.lastName)) {
    req.body.fullName = `${req.body.firstName || ""} ${req.body.lastName || ""}`.trim();
  }
  const user = await userService.updateUserById(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Profile Updated", status: "OK", statusCode: httpStatus.OK, data: user })
  );
});

// ─── USER role: complete profile (Step 2 for clients) ───────────────────────────
const completeUserProfile = catchAsync(async (req, res) => {
  // optional In-Body scan uploads
  const inBodyFiles = req.files
    ? req.files.map((f) => `/uploads/users/${f.filename}`)
    : [];

  const user = await userService.completeUserProfile(req.user.id, req.body, inBodyFiles);
  res.status(httpStatus.OK).json(
    response({
      message: "Profile completed successfully",
      status: "OK",
      statusCode: httpStatus.OK,
      data: user,
    })
  );
});

// ─── PROVIDER role: complete profile (Step 2 for providers) ────────────────────
const completeProviderProfile = catchAsync(async (req, res) => {
  // Separate uploaded files by fieldname
  const certificateImages = (req.files || [])
    .filter((f) => f.fieldname === "certificateImages")
    .map((f)   => `/uploads/providers/${f.filename}`);

  const otherDocuments = (req.files || [])
    .filter((f) => f.fieldname === "otherDocuments")
    .map((f)   => `/uploads/providers/${f.filename}`);

  const user = await userService.completeProviderProfile(
    req.user.id,
    req.body,
    certificateImages,
    otherDocuments
  );

  res.status(httpStatus.OK).json(
    response({
      message:
        "Profile submitted for admin review. You will be notified once approved.",
      status: "OK",
      statusCode: httpStatus.OK,
      data: user,
    })
  );
});

// ─── ADMIN: approve or reject a provider ────────────────────────────────────────
const reviewProviderProfile = catchAsync(async (req, res) => {
  const user = await userService.reviewProviderProfile(req.params.userId, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: `Provider ${req.body.approvalStatus} successfully`,
      status: "OK",
      statusCode: httpStatus.OK,
      data: user,
    })
  );
});

// ─── Admin: get all pending provider requests ────────────────────────────────────
const getPendingProviders = catchAsync(async (req, res) => {
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result  = await userService.queryUsers(
    { role: "provider", "providerProfile.approvalStatus": "pending" },
    options
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Pending Provider Requests",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

// ─── Admin: hard-delete any user ────────────────────────────────────────────────
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.OK).json(
    response({ message: "User Deleted", status: "OK", statusCode: httpStatus.OK, data: {} })
  );
});

module.exports = {
  getUsers,
  getProfile,
  getUser,
  updateProfile,
  completeUserProfile,
  completeProviderProfile,
  reviewProviderProfile,
  getPendingProviders,
  deleteUser,
};









// // user.controller.js
// const httpStatus = require("http-status");
// const pick = require("../utils/pick");
// const ApiError = require("../utils/ApiError");
// const catchAsync = require("../utils/catchAsync");
// const response = require("../config/response");
// const { userService } = require("../services");
// const unlinkImages = require("../common/unlinkImage");

// const createUser = catchAsync(async (req, res) => {
//   const user = await userService.createUser(req.body);
//   res.status(httpStatus.CREATED).json(
//     response({
//       message: "User Created",
//       status: "OK",
//       statusCode: httpStatus.CREATED,
//       data: user,
//     })
//   );
// });

// const getUsers = catchAsync(async (req, res) => {
//   const filter = pick(req.query, ["name", "role", "gender"]);
//   const options = pick(req.query, ["sortBy", "limit", "page"]);
//   const result = await userService.queryUsers(filter, options);
//   res.status(httpStatus.OK).json(
//     response({
//       message: "All Users",
//       status: "OK",
//       statusCode: httpStatus.OK,
//       data: result,
//     })
//   );
// });

// const getProfile = catchAsync(async (req, res) => {
//   const user = await userService.getUserById(req.user.id);

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   if (user.isDeleted) {
//     throw new ApiError(httpStatus.NOT_FOUND, "The account is deleted");
//   }

//   if (user.isBlocked) {
//     throw new ApiError(httpStatus.NOT_FOUND, "The account is blocked");
//   }

//   const { securitySettings } = user;

//   res.status(httpStatus.OK).json(
//     response({
//       message: "User Profile",
//       status: "OK",
//       statusCode: httpStatus.OK,
//       data: { user, securitySettings },
//     })
//   );
// });

// const getUser = catchAsync(async (req, res) => {
//   let user = await userService.getUserById(req.params.userId);

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   res.status(httpStatus.OK).json(
//     response({
//       message: "User",
//       status: "OK",
//       statusCode: httpStatus.OK,
//       data: user,
//     })
//   );
// });

// const updateUser = catchAsync(async (req, res) => {
//   if (req.body.interest) {
//     const parsedInterest = JSON.parse(req.body.interest);
//     req.body.interest = parsedInterest;
//   }
//   const image = {};
//   console.log(req.file);
//   if (req.file) {
//     image.url = "/uploads/users/" + req.file.filename;
//     image.path = req.file.path;
//   }
//   if (req.file) {
//     req.body.image = image;
//   }

//   const user = await userService.updateUserById(req.params.userId, req.body);

//   res.status(httpStatus.OK).json(
//     response({
//       message: "User Updated",
//       status: "OK",
//       statusCode: httpStatus.OK,
//       data: user,
//     })
//   );
// });

// const updateProfile = catchAsync(async (req, res) => {
//   if (req.file) {
//     req.body.image = `/uploads/users/${req.file.filename}`;
//   }

//   // Set fullName if firstName or lastName is provided
//   if (!req.body.fullName && (req.body.firstName || req.body.lastName)) {
//     req.body.fullName = `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim();
//   }

//   const user = await userService.updateUserById(req.user.id, req.body);

//   res.status(httpStatus.OK).json(
//     response({
//       message: "User Updated",
//       status: "OK",
//       statusCode: httpStatus.OK,
//       data: user,
//     })
//   );
// });

// const deleteUser = catchAsync(async (req, res) => {
//   await userService.deleteUserById(req.params.userId);
//   res.status(httpStatus.OK).json(
//     response({
//       message: "User Deleted",
//       status: "OK",
//       statusCode: httpStatus.OK,
//       data: {},
//     })
//   );
// });

// module.exports = {
//   createUser,
//   getUsers,
//   getUser,
//   getProfile,
//   updateUser,
//   updateProfile,
//   deleteUser,
// };
