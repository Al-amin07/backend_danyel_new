import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './user.model';
// import { uploadImgToCloudinary } from '../../util/uploadImgToCloudinary';
import { TCompanyUser } from '../Company/company.interface';
import ApppError from '../../error/AppError';
import { StatusCodes } from 'http-status-codes';
import { Company } from '../Company/company.model';
import { TDriverUser } from '../Driver/driver.interface';
import { Driver } from '../Driver/driver.model';
import { sendEmail } from '../../util/sendEmail';
import generateOTPEmail from '../../util/generateOtpEmail';

import { generateOtp } from '../../util/generateOtp';
import { TUser } from './user.interface';
import config from '../../config';
import authUtil from '../auth/auth.utill';
import QueryBuilder from '../../builder/QueryBuilder';

const createAdminToDB = async (
  payload: TUser,
  file: Express.Multer.File | undefined,
) => {
  const isUserExist = await User.findOne({ email: payload.email });
  if (isUserExist) {
    throw new ApppError(StatusCodes.CONFLICT, 'This user already exist!');
  }
  const { name, email, phone, password } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const userInfo: Partial<TUser> = {
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'admin',
    emailVerificationCode: otp,
    emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
  };
  if (file?.path) {
    userInfo.profileImage = `${config.server_url}/uploads/${file?.filename}`;
  }
  const result = await User.create(userInfo);
  const sendEmailTo = await sendEmail(
    email,
    'Your verification code',
    generateOTPEmail(otp, name),
  );
  console.log({ sendEmailTo });
  return result;
};

const createCompanyToDB = async (
  payload: TCompanyUser,
  file: Express.Multer.File | undefined,
) => {
  if (!payload) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User info not found!!');
  }

  const isUserExist = await User.findOne({ email: payload.email }).select(
    '+password',
  );

  if (isUserExist) {
    throw new ApppError(StatusCodes.CONFLICT, 'This user already exist!');
  }

  const { name, email, phone, password, role, ...extra } = payload;

  if (!password) {
    throw new Error('Password is required');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  // const otp = generateOtp();
  const userInfo: Partial<TUser> = {
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'company',
    emailVerificationCode: '',
    emailVerificationExpires: new Date(),
    isVerified: true,
  };
  if (file?.path) {
    userInfo.profileImage = `${config.server_url}/uploads/${file?.filename}`;
  }
  console.log({ userInfo });
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await User.create([userInfo], { session });
    console.log({ result });
    const companyInfo = {
      user: result[0]?._id,
      companyName: extra?.companyName || '',
      companyAddress: extra?.companyAddress || '',
      numberOfEmployees: extra?.numberOfEmployees || 0,
      startOperationHour: extra?.startOperationHour || '',
      endOperationHour: extra?.endOperationHour || '',
      paymentTerms: extra?.paymentTerms,
      address: extra?.address,
      notificationPreferences: extra?.notificationPreferences,
      languagePreference: extra?.languagePreference,
      timeZone: extra?.timeZone,
      currency: extra?.currency,
      dateFormat: extra?.dateFormat,
    };
    await Company.create([companyInfo], { session });
    await session.commitTransaction();
    session.endSession();
    // const sendEmailTo = await sendEmail(
    //   email,
    //   'Your verification code',
    //   generateOTPEmail(otp, name),
    // );
    // console.log({ sendEmailTo });
    return result[0];
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const createDriverToDB = async (
  payload: TDriverUser,
  file: Express.Multer.File | undefined,
) => {
  const { name, email, password, phone, ...driverData } = payload;
  console.log({ name, email, password, phone });

  const isUserExist = await User.findOne({ email }).select('+password');
  if (isUserExist) {
    throw new ApppError(StatusCodes.CONFLICT, 'This user already exist!');
  }
  const driverId = generateDriverId();

  const otp = generateOtp();
  const hashedPassword = await bcrypt.hash(password, 10);
  const userInfo: Partial<TUser> = {
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'driver',
    emailVerificationCode: otp,
    emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
  };
  if (file?.path) {
    userInfo.profileImage = `${config.server_url}/uploads/${file?.filename}`;
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await User.create([userInfo], { session });
    const { user, ...restDriverData } = driverData;
    const driverInfo = {
      user: result[0]?.id,
      ...restDriverData,
      driverId,
    };

    await Driver.create([driverInfo], { session });

    await session.commitTransaction();
    session.endSession();

    const sendEmailTo = await sendEmail(
      email,
      'Your verification code',
      generateOTPEmail(otp, name),
    );
    console.log({ resulttt: result[0] });
    return result[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const createSuperAdmin = async (payload: TUser) => {
  const isSuperAdminExist = await User.findOne({
    email: payload?.email,
    role: 'super-admin',
  });
  if (isSuperAdminExist) {
    throw new ApppError(StatusCodes.CONFLICT, 'Super admin already exist');
  }
  const hashedPassword = await bcrypt.hash(payload?.password, 10);
  const userinfo = {
    name: payload?.name || 'John Doe',
    email: payload?.email || 'john.doe@example.com',
    phone: payload?.phone || '1234567890',
    password: hashedPassword,
    role: 'super-admin',
    isVerified: true,
  };
  const result = await User.create(userinfo);
  const accessToken = authUtil.createToken(
    {
      id: result._id,
      role: result.role,
      username: result.name,
      email: result.email,
    },
    config.jwt_token_secret,
    config.token_expairsIn,
  );
  return { accessToken };
};
const getAllUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find().select('-password'), query)
    .search(['name', 'email', 'phone', 'role'])
    .filter()
    .sort()
    .paginate();
  const result = await userQuery.modelQuery;
  const meta = await userQuery.getMetaData();
  return {
    result,
    meta,
  };
};

const getUserProfile = async (userId: string) => {
  const isUserExist = await User.findById(userId).select('-password');
  if (!isUserExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (isUserExist?.role === 'company') {
    const companyProfile = await Company.findOne({
      user: isUserExist.id,
    })
      .populate('user', '-password')
      .populate('loads');
    return companyProfile;
  } else if (isUserExist?.role === 'driver') {
    const driverProfile = await Driver.findOne({
      user: isUserExist.id,
    })
      .populate('user', '-password')
      .populate('loads')
      .populate('currentLoad')
      .populate('reviews.loadId');
    return driverProfile;
  } else {
    return isUserExist;
  }
};

const blockUser = async (userId: string, payload: { isBlocked: boolean }) => {
  console.log({ userId, payload });
  const isUserExist = await User.findById(userId).select('-password');
  if (!isUserExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  const result = await User.findByIdAndUpdate(
    userId,
    { isBlocked: payload?.isBlocked },
    { new: true },
  ).select('-password');
  return result;
};
const deleteUser = async (userId: string, payload: { isDeleted: boolean }) => {
  console.log({ userId, payload });
  const isUserExist = await User.findById(userId).select('-password');
  if (!isUserExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  const result = await User.findByIdAndUpdate(
    userId,
    { isDeleted: payload?.isDeleted },
    { new: true },
  ).select('-password');
  return result;
};

const addFirebaseToken = async (userId: string, payload: { token: string }) => {
  const isUserExist = await User.findById(userId).select('-password');
  if (!isUserExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  // console.log({ isUserExist, payload });
  const result = await User.findByIdAndUpdate(
    userId,
    { firebaseToken: payload?.token },
    { new: true },
  ).select('-password');
  // console.log({ result });
  return result;
};

const userServices = {
  createAdminToDB,
  createCompanyToDB,
  createDriverToDB,
  getAllUsers,
  getUserProfile,
  createSuperAdmin,
  deleteUser,
  blockUser,
  addFirebaseToken,
};

export default userServices;

function generateDriverId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// const createCompanyToDB = async (
//   payload: TCompanyUser,
//   file: Express.Multer.File | undefined,
// ) => {
//   if (!payload) {
//     throw new ApppError(StatusCodes.NOT_FOUND, 'User info not found!!');
//   }

//   const isUserExist = await User.findOne({ email: payload.email }).select(
//     '+password',
//   );

//   if (isUserExist) {
//     throw new ApppError(StatusCodes.CONFLICT, 'This user already exist!');
//   }

//   const { name, email, phone, password, role, ...extra } = payload;

//   if (!password) {
//     throw new Error('Password is required');
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);
//   const otp = generateOtp();
//   const userInfo: Partial<TUser> = {
//     name,
//     email,
//     phone,
//     password: hashedPassword,
//     role: 'company',
//     emailVerificationCode: otp,
//     emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
//   };
//   if (file?.path) {
//     userInfo.profileImage = `${config.server_url}/uploads/${file?.filename}`;
//   }
//   console.log({ userInfo });
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const result = await User.create([userInfo], { session });
//     console.log({ result });
//     const companyInfo = {
//       user: result[0]?._id,
//       companyName: extra?.companyName || '',
//       companyAddress: extra?.companyAddress || '',
//       numberOfEmployees: extra?.numberOfEmployees || 0,
//       startOperationHour: extra?.startOperationHour || '',
//       endOperationHour: extra?.endOperationHour || '',
//       paymentTerms: extra?.paymentTerms,
//       address: extra?.address,
//       notificationPreferences: extra?.notificationPreferences,
//       languagePreference: extra?.languagePreference,
//       timeZone: extra?.timeZone,
//       currency: extra?.currency,
//       dateFormat: extra?.dateFormat,
//     };
//     await Company.create([companyInfo], { session });
//     await session.commitTransaction();
//     session.endSession();
//     const sendEmailTo = await sendEmail(
//       email,
//       'Your verification code',
//       generateOTPEmail(otp, name),
//     );
//     console.log({ sendEmailTo });
//     return result[0];
//   } catch (error) {
//     // Rollback transaction
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };
