import { Schema, model } from 'mongoose';
import { IMessage } from './message.interface';

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    document: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Message = model<IMessage>('Message', messageSchema);
