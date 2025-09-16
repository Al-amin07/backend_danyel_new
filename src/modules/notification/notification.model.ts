import { model, Schema } from 'mongoose';
import { ENotificationType, INotification } from './notification.interface';

const notificationSchema = new Schema<INotification>(
  {
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: Object.values(ENotificationType),
      required: true,
    },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    load: { type: Schema.Types.ObjectId, ref: 'Load' },
  },
  { timestamps: true },
);

export const Notification = model<INotification>(
  'Notification',
  notificationSchema,
);
