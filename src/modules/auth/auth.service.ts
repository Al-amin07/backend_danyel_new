import bcrypt from 'bcrypt';
import config from '../../config';
import authUtill from './auth.utill';
import { User } from '../user/user.model';
import idConverter from '../../util/idConvirter';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sendEmail } from '../../util/sendEmail';
import ApppError from '../../error/AppError';
import { StatusCodes } from 'http-status-codes';

import { generateOtp } from '../../util/generateOtp';
import generateForgetPasswordEmail from '../../util/generateForgetPasswordEmail';
import generateOTPEmail from '../../util/generateOtpEmail';
import authUtil from './auth.utill';
import { logLogin } from '../../middleware/logLogin';

const logIn = async (
  req: any,
  payload: { email: string; password: string },
) => {
  const { email, password } = payload;
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'No user found with this email');
  }

  if (user?.isBlocked || user?.isDeleted) {
    throw new ApppError(
      StatusCodes.FORBIDDEN,
      'This user is blocked or deleted',
    );
  }
  if (!user?.isVerified) {
    throw new ApppError(StatusCodes.FORBIDDEN, 'This user is not verified');
  }
  // Password check for email login
  const isPasswordmatch = await bcrypt.compare(password, user.password);
  console.log({ user, isPasswordmatch });
  if (!isPasswordmatch) {
    throw new ApppError(StatusCodes.CONFLICT, 'Incorrect password!!');
  }

  const updatedUser = await User.findOneAndUpdate(
    { email },
    { lastLoggedin: new Date() },
    { new: true },
  ).select('-password');

  const tokenizeData = {
    id: user._id,
    role: user.role,
    username: updatedUser?.name,
    email: updatedUser?.email,
  };

  const accessToken = authUtill.createToken(
    tokenizeData,
    config.jwt_token_secret,
    config.token_expairsIn,
  );

  const refreshToken = authUtill.createToken(
    tokenizeData,
    config.jwt_refresh_Token_secret,
    config.rifresh_expairsIn,
  );
  await logLogin(true, user._id.toString(), req);

  return { accessToken, refreshToken, userData: updatedUser };
};

const logOut = async (userId: string) => {
  const convertedId = idConverter(userId);

  const findUserById = await User.findOneAndUpdate(
    { _id: convertedId },
    { isLoggedIn: false, loggedOutTime: new Date() },
    { new: true },
  );
  return findUserById;
};

const changePassword = async (
  id: string,
  oldPassword: string,
  newPassword: string,
) => {
  // Find the user and include the password field
  const findUser = await User.findById(id).lean(); // Convert to a plain object for performance
  if (!findUser || !findUser.password) {
    throw new ApppError(
      StatusCodes.NOT_FOUND,
      'User not found or password missing',
    );
  }

  // Compare old password with hashed password
  const isPasswordMatch = await bcrypt.compare(oldPassword, findUser.password);

  if (!isPasswordMatch) {
    throw new ApppError(StatusCodes.CONFLICT, 'Old password is incorrect');
  }

  // Hash the new password
  const newPasswordHash = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt),
  );

  // Update the password
  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      password: newPasswordHash,
      passwordChangeTime: new Date(),
    },
    { new: true },
  ).select('-password');

  console.log({ updatedUser });

  if (!updatedUser) {
    throw new Error('Error updating password');
  }

  return updatedUser;
};

const refreshToken = async (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    config.jwt_refresh_Token_secret as string,
  );

  if (!decoded) {
    throw Error('tocan decodaing Failed');
  }

  const { id, iat, role } = decoded as JwtPayload;

  const findUser = await User.findOne({
    _id: id,
    isDelited: false,
  });

  if (!findUser) {
    throw Error('Unauthorised User or forbitten Access');
  }

  const JwtPayload = {
    id: findUser.id,
    role: role,
  };
  const approvalToken = authUtill.createToken(
    JwtPayload,
    config.jwt_token_secret as string,
    config.token_expairsIn as string,
  );

  return {
    approvalToken,
  };
};

const forgetPassword = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApppError(
      StatusCodes.NOT_FOUND,
      'User not found with this email',
    );
  }

  if (user.isDeleted || user.isBlocked) {
    throw new ApppError(
      StatusCodes.LOCKED,
      'This user is blocked. This function is not available.',
    );
  }
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const updatedUser = await User.findOneAndUpdate(
    { email },
    { forgetPasswordCode: otp, forgetPasswordExpires: otpExpiry },
    { new: true },
  ).select('-password');
  await user.save();
  await sendEmail(
    email,
    'Your verification code',
    generateForgetPasswordEmail(otp, user.name),
  );
  return 'Reset password email sent successfully';
};
const verifyForgetPasswordOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (user.forgetPasswordCode !== otp) {
    throw new ApppError(StatusCodes.UNAUTHORIZED, 'Invalid OTP');
  }
  if (user.forgetPasswordExpires && user.forgetPasswordExpires < new Date()) {
    throw new ApppError(StatusCodes.UNAUTHORIZED, 'OTP has expired');
  }

  await User.findOneAndUpdate(
    { email },
    {
      forgetPasswordCode: '',
      forgetPasswordExpires: new Date(0),
      isResettingPassword: true,
    },
    { new: true },
  );
  const token = authUtil.createToken(
    { email: user.email, role: user.role, id: user.id },
    config.jwt_token_secret,
    config.token_expairsIn,
  );

  return 'Otp verified';
};

const resetPassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (user.forgetPasswordCode || !user?.isResettingPassword) {
    throw new ApppError(StatusCodes.UNAUTHORIZED, 'Verify your otp first');
  }

  const newPasswordHash = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt),
  );

  // Update the user's password and passwordChangeTime
  const updatePassword = await User.findOneAndUpdate(
    { email },
    {
      password: newPasswordHash,
      passwordChangeTime: new Date(),
      isResettingPassword: false,
    },
    { new: true },
  );

  if (!updatePassword) {
    throw new ApppError(StatusCodes.CONFLICT, 'Error updating password');
  }

  return { passwordChanged: true };
};
const sendVerifyEmailOtpAgain = async (email: string) => {
  const isUserExist = await User.findOne({ email }).select('+password');
  if (!isUserExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (isUserExist.isVerified) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'This email is already verified',
    );
  }
  const otp = generateOtp();
  const result = await User.findOneAndUpdate(
    { email },
    {
      emailVerificationCode: otp,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
    { new: true },
  );
  if (!result) {
    throw new ApppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Operation failed');
  }
  const sendEmailTo = await sendEmail(
    email,
    'Your verification code',
    generateOTPEmail(otp, result.name),
  );
  if (sendEmailTo.success === false) {
    throw new ApppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to send email',
    );
  }
  return 'Verification email sent successfully';
};

const verifyOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email }).lean();
  console.log({ user });
  if (!user) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (user?.isVerified) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'This email is already verified',
    );
  }
  if (user.emailVerificationCode !== otp) {
    throw new ApppError(StatusCodes.UNAUTHORIZED, 'Invalid OTP');
  }
  if (
    user.emailVerificationExpires &&
    user.emailVerificationExpires < new Date()
  ) {
    throw new ApppError(StatusCodes.UNAUTHORIZED, 'OTP has expired');
  }
  user.isVerified = true;
  user.emailVerificationCode = '';
  user.emailVerificationExpires = undefined;
  user.lastLoggedin = new Date();
  const updatedUser = await User.findOneAndUpdate({ email }, user, {
    new: true,
  }).select('-password');

  const tokenizeData = {
    id: user._id,
    role: user.role,
    username: updatedUser?.name,
    email: updatedUser?.email,
  };

  const accessToken = authUtil.createToken(
    tokenizeData,
    config.jwt_token_secret,
    config.token_expairsIn,
  );

  const refreshToken = authUtil.createToken(
    tokenizeData,
    config.jwt_refresh_Token_secret,
    config.rifresh_expairsIn,
  );

  return { accessToken, refreshToken, userData: updatedUser };
};

const authServices = {
  logIn,
  logOut,
  changePassword,
  refreshToken,
  forgetPassword,
  resetPassword,
  sendVerifyEmailOtpAgain,
  verifyOtp,
  verifyForgetPasswordOtp,
};
export default authServices;
