import { Types, Document } from 'mongoose';
import { TUser } from '../user/user.interface';

export interface ILocation {
  type: 'Point';
  city: string;
  street: string;
  zipCode: string;
  state: string;
  country: string;
  coordinates: number[];
}

export enum EVehicleType {
  PICKUP = 'Pickup Truck',
  MINI_TRUCK = 'Mini Truck',
  CARGO_VAN = 'Cargo Van',
  BOX_TRUCK = 'Box Truck',
  FLATBED_TRUCK = 'Flatbed Truck',
  TRAILER = 'Trailer / Semi-Truck',
  TANKER = 'Tanker Truck',
  REFRIGERATED_TRUCK = 'Refrigerated Truck',
}

export enum EVehicleModel {
  // Pickup Trucks
  TOYOTA_HILUX = 'Toyota Hilux',
  FORD_RANGER = 'Ford Ranger',
  MAHINDRA_BOLERO = 'Mahindra Bolero Pickup',
  TATA_XENON = 'Tata Xenon',
  ISUZU_DMAX = 'Isuzu D-Max',
  NISSAN_NAVARA = 'Nissan Navara',
  MITSUBISHI_TRITON = 'Mitsubishi Triton',
  CHEVROLET_COLORADO = 'Chevrolet Colorado',

  // Mini & Light Trucks
  TATA_ACE = 'Tata Ace',
  TATA_407 = 'Tata 407',
  ASHOK_LEYLAND_DOST = 'Ashok Leyland Dost',
  MAHINDRA_JEETO = 'Mahindra Jeeto',
  HYUNDAI_H100 = 'Hyundai H100',
  SUZUKI_CARRY = 'Suzuki Carry',
  PIAGGIO_APE = 'Piaggio Ape',

  // Vans (Cargo)
  TOYOTA_HIACE = 'Toyota HiAce',
  NISSAN_NV200 = 'Nissan NV200',
  FORD_TRANSIT = 'Ford Transit',
  MERCEDES_SPRINTER = 'Mercedes-Benz Sprinter',

  // Medium Duty Trucks
  ISUZU_N_SERIES = 'Isuzu N-Series',
  MITSUBISHI_CANTER = 'Mitsubishi Fuso Canter',
  HINO_300 = 'Hino 300',
  EICHER_PRO_1049 = 'Eicher Pro 1049',

  // Heavy Duty Trucks
  HINO_500 = 'Hino 500',
  TATA_PRIMA = 'Tata Prima',
  ASHOK_LEYLAND_ECOMET = 'Ashok Leyland Ecomet',
  MERCEDES_ACTROS = 'Mercedes-Benz Actros',
  VOLVO_FM = 'Volvo FM',
  VOLVO_FH16 = 'Volvo FH16',
  SCANIA_R_SERIES = 'Scania R-Series',
  MAN_TGS = 'MAN TGS',
  DAF_XF = 'DAF XF',

  // Special Trucks
  TANKER_TRUCK = 'Tanker Truck',
  REFRIGERATED_TRUCK = 'Refrigerated Truck',
  FLATBED_TRUCK = 'Flatbed Truck',
  BOX_TRUCK = 'Box Truck',
  SEMI_TRAILER = 'Semi-Trailer Truck',
}

export enum EAvailability {
  ON_DUTY = 'On Duty',
  AVAILABLE = 'Available',
}

export interface IReview {
  review: string;
  rating: number;
  companyId: Types.ObjectId;
  loadId: Types.ObjectId;
}

export interface IDriver extends Document {
  user: Types.ObjectId;
  location?: ILocation;
  licenseNumber?: string;
  vehicleType?: EVehicleType;
  vehicleModel?: EVehicleModel;
  companyId?: Types.ObjectId; // Company this driver belongs to
  loads: Types.ObjectId[]; // References to Load documents

  availability: EAvailability;
  workingHours: string;
  preferredDeliveryZones?: string[];
  onTimeRate?: number;
  // Optional fields for profile updates
  nidOrPassport?: IFileType;
  drivingLicense?: IFileType;
  vehicleRegistration?: IFileType;

  experience?: number;
  otherInfo?: string; // any extra info
  reviews?: IReview[];
  averageRating?: number;
  status: boolean;
  driverId: string;
  notificationPreferences: {
    LOAD_ASSIGNMENT: boolean;
    LOAD_STATUS_UPDATE: boolean;
    LOAD_DELIVERY_REMINDER: boolean;
    PAYMENT: boolean;
    SYSTEM_ALERT: boolean;
    COMMUNICATION: boolean;
  };
  declinedLoads?: Types.ObjectId[];
  currentLoad?: Types.ObjectId;
}

export interface IFileType {
  url: string;
  type: string;
}

export type TDriverUser = TUser & IDriver;
