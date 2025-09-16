import { StatusCodes } from 'http-status-codes';
import ApppError from '../../error/AppError';
import catchAsync from '../../util/catchAsync';
import sendResponse from '../../util/sendResponse';
import authServices from './auth.service';

const logIn = catchAsync(async (req, res) => {
  const result = await authServices.logIn(req, req.body);
  const { accessToken, refreshToken } = result;
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'user logged in successfully',
    data: {
      accessToken,
      refreshToken,
      user: result.userData,
    },
  });
});

const logOut = catchAsync(async (req, res) => {
  const userId = req?.user.id;

  if (!userId) {
    throw new ApppError(StatusCodes.UNAUTHORIZED, 'Token is missing');
  }

  await authServices.logOut(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'user logged out successfully',
    data: null,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const result = await authServices.changePassword(
    req.user?.id,
    oldPassword,
    newPassword,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'password changed successfully',
    data: result,
  });
});
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await authServices.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'token refreshed successfully',
    data: result,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const email = req.body?.email;
  const result = await authServices.forgetPassword(email);
  res.status(200).json({
    success: true,
    message: 'reset password token genarated check your email',
    body: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { newPassword, email } = req.body;

  const result = await authServices.resetPassword(email, newPassword);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'password reset successfully',
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authServices.verifyOtp(email, otp);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Otp verified successfully',
    data: result,
  });
});
const verifyForgetPasswordOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authServices.verifyForgetPasswordOtp(email, otp);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Otp verified successfully',
    data: result,
  });
});
const sendVerifyOtpAgain = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authServices.sendVerifyEmailOtpAgain(email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Otp sent successfully',
    data: result,
  });
});

const authController = {
  logIn,
  logOut,
  changePassword,
  refreshToken,
  forgetPassword,
  resetPassword,
  sendVerifyOtpAgain,
  verifyOtp,
  verifyForgetPasswordOtp,
};
export default authController;
