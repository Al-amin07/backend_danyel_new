import express from 'express';
import authController from './auth.controller';
import validator from '../../middleware/validator';
import { logInValidator } from './auth.validator';
import auth from '../../middleware/auth';
import { userRole } from '../../constents';

const authRouter = express.Router();

authRouter.post('/login', validator(logInValidator), authController.logIn);
// authRouter.post(
//   '/logOut',
//   auth(userRole.admin, userRole.user),
//   authController.logOut,
// );
authRouter.post(
  '/change-password',
  auth(userRole.admin, userRole.company, userRole.driver),
  authController.changePassword,
);

authRouter.post('/refresh-token', authController.refreshToken);

authRouter.post('/forget-password', authController.forgetPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/send-otp', authController.sendVerifyOtpAgain);
authRouter.post('/verify-otp', authController.verifyOtp);
authRouter.post(
  '/verify-forget-password-otp',
  authController.verifyForgetPasswordOtp,
);
export default authRouter;
