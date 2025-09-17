import { Schema, model } from 'mongoose';
import {
  IAddress,
  ICustomer,
  IDocument,
  ILoad,
  IReview,
  IStatusTimeline,
} from './load.interface';
import { LoadPaymentStatusArray, LoadStatusArray } from './load.constant';

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  apartment: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: Number, required: true },
  country: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
});

const statusSchema = new Schema<IStatusTimeline>(
  {
    status: {
      type: String,
      enum: LoadStatusArray,
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String }, // optional (e.g. "Load assigned to John Doe")
    expectedDeliveryDate: { type: Date }, // optional (e.g. "Expected delivery date: 2023-05-15")
  },
  { _id: false },
);

const customerSchema = new Schema<ICustomer>({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
});
const reviewSchema = new Schema<IReview>(
  {
    rating: { type: Number },
    comment: { type: String },
  },
  { timestamps: true },
);

const DocumentSchema = new Schema<IDocument>(
  {
    type: { type: String, required: true },
    url: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

const LeadSchema = new Schema<ILoad>(
  {
    loadId: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true },
    weight: { type: Number, required: true },
    loadType: { type: String, required: true },
    specialInstructions: { type: String },

    pickupAddress: { type: AddressSchema, required: true },
    deliveryAddress: { type: AddressSchema, required: true },
    loadStatus: {
      type: String,
      enum: LoadStatusArray,
      default: 'Pending Assignment',
    },

    pickupDate: { type: Date },
    pickupTime: { type: String },
    deliveryDate: { type: Date },
    deliveryTime: { type: String },

    totalDistance: { type: Number, required: true },
    ratePerMile: { type: Number, required: true },
    totalPayment: { type: Number },
    companyId: { type: String, required: true, ref: 'Company' },
    statusTimeline: [statusSchema],

    paymentStatus: {
      type: String,
      enum: LoadPaymentStatusArray,
      default: 'PENDING',
    },
    customerNotes: { type: String },
    paymentDate: { type: Date },
    requestedDrivers: { type: [Schema.Types.ObjectId], ref: 'Driver' },
    assignedDriver: { type: Schema.Types.ObjectId, ref: 'Driver' },
    customer: { type: customerSchema, required: true },
    documents: [DocumentSchema],
    review: { type: reviewSchema },
  },
  { timestamps: true },
);

export const LoadModel = model<ILoad>('Load', LeadSchema);
