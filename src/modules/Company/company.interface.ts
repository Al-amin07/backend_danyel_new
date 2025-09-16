import { Types } from 'mongoose';
import { TUser } from '../user/user.interface';

export interface ICompany extends Document {
  user: Types.ObjectId; // Reference to User

  companyName: string;
  companyAddress?: string;

  numberOfEmployees?: number;
  startOperationHour?: string;
  endOperationHour?: string;

  paymentTerms?: 'perMile' | 'perKilo';

  // Address fields
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push?: boolean;
    loadAssignment: boolean;
    driverStatusUpdate: boolean;
    pendingPayment: boolean;
    securityAlert: boolean;
  };

  // Preferences
  languagePreference?: string;
  timeZone?: string;
  currency?: string;
  dateFormat?: string; // e.g., "MM/DD/YYYY"

  loads: Types.ObjectId[];
  drivers: Types.ObjectId[];
}

export type TCompanyUser = TUser & ICompany;
