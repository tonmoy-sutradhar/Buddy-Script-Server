const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { userService } = require("../services");

const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: "User profile",
      statusCode: httpStatus.OK,
      data: { user },
    }),
  );
});

const updateProfile = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.image = `/uploads/users/${req.file.filename}`;
  }
  const user = await userService.updateUserById(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Profile updated",
      statusCode: httpStatus.OK,
      data: { user },
    }),
  );
});

module.exports = {
  getProfile,
  updateProfile,
};
