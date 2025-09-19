import { ICompany } from './company.interface';
import { model, Schema } from 'mongoose';

const CompanySchema = new Schema<ICompany>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    companyAddress: { type: String },
    numberOfEmployees: { type: Number },
    startOperationHour: { type: String },
    endOperationHour: { type: String },

    paymentTerms: {
      type: String,
      enum: ['perMile', 'perKilo'],
      default: 'perMile',
    },

    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },

    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      loadAssignment: { type: Boolean, default: true },
      driverStatusUpdate: { type: Boolean, default: true },
      pendingPayment: { type: Boolean, default: true },
      securityAlert: { type: Boolean, default: true },
    },

    languagePreference: { type: String, default: 'en' },
    timeZone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    loads: [{ type: Schema.Types.ObjectId, ref: 'Load' }],
    drivers: [{ type: Schema.Types.ObjectId, ref: 'Driver' }],
    requestedDrivers: [{ type: Schema.Types.ObjectId, ref: 'Driver' }],
  },
  { timestamps: true },
);

export const Company = model<ICompany>('Company', CompanySchema);
