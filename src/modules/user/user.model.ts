import mongoose, { Schema } from 'mongoose';
import { TUser } from './user.interface';
import { userRole } from '../../constents';

const UserSchema = new Schema<TUser>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastName: { type: String },
    jobTitle: { type: String },
    role: {
      type: String,
      enum: ['admin', 'company', 'driver', 'super-admin'],
      required: true,
      default: userRole.company,
    },
    profileImage: { type: String },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isProfileUpdate: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerificationExpires: { type: Date },
    isResettingPassword: { type: Boolean },
    forgetPasswordCode: { type: String },
    forgetPasswordExpires: { type: Date },
    passwordChangeTime: { type: Date },
    firbaseToken: { type: String },
    lastLoggedin: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', UserSchema);
