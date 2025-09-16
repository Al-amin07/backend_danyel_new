import { model, Schema } from 'mongoose';
import { ISupport } from './support.interface';

const SupportFormSchema = new Schema<ISupport>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// 3. Export the model
export const Support = model<ISupport>('Support', SupportFormSchema);
