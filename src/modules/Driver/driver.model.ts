import { Schema, model } from 'mongoose';
import {
  IDriver,
  EVehicleType,
  EVehicleModel,
  EAvailability,
  ILocation,
  IFileType,
  IReview,
} from './driver.interface';

// Sub-schema for Location (GeoJSON)
const LocationSchema = new Schema<ILocation>({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
  city: { type: String, required: true },
  street: { type: String, required: true },
  zipCode: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
});

// Add geospatial index for $near queries
LocationSchema.index({ coordinates: '2dsphere' });

const FileSchema = new Schema<IFileType>({
  url: { type: String, required: true },
  type: { type: String, required: true },
});

const ReviewSchema = new Schema<IReview>({
  review: { type: String },
  rating: { type: Number, required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  loadId: { type: Schema.Types.ObjectId, ref: 'Load', required: true },
});

const DriverSchema = new Schema<IDriver>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: LocationSchema, required: false }, // GeoJSON location
    licenseNumber: { type: String },
    currentLoad: { type: Schema.Types.ObjectId, ref: 'Load' },
    vehicleType: {
      type: String,
      enum: Object.values(EVehicleType),
    },
    vehicleModel: {
      type: String,
      enum: Object.values(EVehicleModel),
    },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    loads: [{ type: Schema.Types.ObjectId, ref: 'Load' }],
    availability: {
      type: String,
      enum: Object.values(EAvailability),
      default: EAvailability.AVAILABLE,
      required: true,
    },
    onTimeRate: { type: Number },
    workingHours: { type: String, required: true, default: '9am - 5pm' },
    preferredDeliveryZones: [{ type: String }],
    nidOrPassport: { type: FileSchema },
    drivingLicense: { type: FileSchema },
    vehicleRegistration: { type: FileSchema },
    experience: { type: Number },
    otherInfo: { type: String },
    reviews: [ReviewSchema],
    averageRating: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    driverId: { type: String, required: true },
    notificationPreferences: {
      LOAD_ASSIGNMENT: { type: Boolean, default: true },
      LOAD_STATUS_UPDATE: { type: Boolean, default: true },
      LOAD_DELIVERY_REMINDER: { type: Boolean, default: true },
      PAYMENT: { type: Boolean, default: true },
      SYSTEM_ALERT: { type: Boolean, default: true },
      COMMUNICATION: { type: Boolean, default: true },
    },
    declinedLoads: [{ type: Schema.Types.ObjectId, ref: 'Load' }],
    currentLocation: {
      lat: { type: Number, default: null },
      lon: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  },
);

export const Driver = model<IDriver>('Driver', DriverSchema);
