import { Types } from 'mongoose';

export interface IMessage {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  text: string;
  document?: string;
  isRead: boolean;
  createdAt?: Date;
}
