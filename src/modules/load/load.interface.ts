import { Types } from 'mongoose';
import { TLoadStatus, TLoadPaymentStatus } from './load.constant';

// Address Type
export interface IAddress {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: number;
  country: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface IDocument {
  type: string;
  url: string;
  name: string;
}

export interface IReview {
  rating: number;
  comment: string;
}

export interface ICustomer {
  name: string;
  email: string;
  phone?: string;
}

export interface IStatusTimeline {
  status: TLoadStatus;
  timestamp: Date;
  notes?: string;
  expectedDeliveryDate?: Date;
}

export interface ILoad {
  loadId: string;
  quantity: number;
  weight: number;
  loadType: string;
  specialInstructions?: string;

  loadStatus: TLoadStatus;

  pickupAddress: IAddress;
  deliveryAddress: IAddress;

  pickupDate?: Date;
  pickupTime?: string;
  deliveryDate?: Date;
  deliveryTime?: string;

  totalDistance: number;
  ratePerMile: number;
  totalPayment: number;

  paymentStatus: TLoadPaymentStatus;
  customerNotes?: string;
  paymentDate?: Date;
  companyId: string;
  assignedDriver?: Types.ObjectId;
  statusTimeline: IStatusTimeline[];
  customer: ICustomer;
  review?: IReview;
  documents: IDocument[];
  createdAt?: Date;
}
