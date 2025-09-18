import { Types } from 'mongoose';
import { ILoad } from '../load/load.interface';

export enum ENotificationType {
  LOAD_ASSIGNMENT = 'LOAD_ASSIGNMENT',
  LOAD_ASSIGNMENT_REQUEST = 'LOAD_ASSIGNMENT_REQUEST',
  LOAD_STATUS_UPDATE = 'LOAD_STATUS_UPDATE',
  LOAD_DELIVERY_REMINDER = 'LOAD_DELIVERY_REMINDER',
  PAYMENT = 'PAYMENT',
  JOIN_REQUEST = 'JOIN_REQUEST',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  COMMUNICATION = 'COMMUNICATION',
  MESSAGE = 'MESSAGE',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
  OTHER = 'OTHER',
}

export interface INotification {
  receiverId?: Types.ObjectId;
  senderId?: Types.ObjectId; // optional, e.g. system notifications
  type: ENotificationType;
  content: string;
  isRead?: boolean;
  load?: Types.ObjectId | ILoad;
}
