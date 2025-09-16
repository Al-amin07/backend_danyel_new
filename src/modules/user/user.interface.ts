import { TUserRole } from '../../constents';

export type TUser = {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: TUserRole;
  isDeleted: boolean;
  isBlocked: boolean;
  lastName?: string;
  jobTitle?: string;
  profileImage?: string;
  isProfileUpdate?: boolean;
  lastLoggedin?: Date;
  isVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;
  forgetPasswordCode?: string;
  forgetPasswordExpires?: Date;
  firbaseToken?: string;
  isResettingPassword?: boolean;
  passwordChangeTime?: Date;
};
