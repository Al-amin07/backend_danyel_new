import mongoose from 'mongoose';

const LoginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ip: { type: String },
  location: { type: String }, // e.g., "Dhaka, Bangladesh"
  device: { type: String }, // e.g., "Chrome on Windows 11"
  success: { type: Boolean, default: true }, // track success/failure
  loginAt: { type: Date, default: Date.now },
});

export const LoginLog = mongoose.model('LoginLog', LoginLogSchema);
