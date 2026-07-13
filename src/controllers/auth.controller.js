const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { authService, tokenService } = require("../services");

const register = catchAsync(async (req, res) => {
  const user = await authService.registerUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).json(
    response({
      message: "Registration successful",
      statusCode: httpStatus.CREATED,
      data: { user, tokens },
    }),
  );
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).json(
    response({
      message: "Login successful",
      statusCode: httpStatus.OK,
      data: { user, tokens },
    }),
  );
});

module.exports = {
  register,
  login,
};
