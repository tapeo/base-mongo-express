import mongoose, { Document, Schema } from "mongoose";

export enum OtpPurpose {
  EMAIL_VERIFICATION = "email_verification",
  TWO_FACTOR = "two_factor",
}

export interface IOtp extends Document {
  user_id: mongoose.Types.ObjectId;
  otp: string;
  purpose: OtpPurpose;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
  updated_at: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: OtpPurpose,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document will be automatically deleted when expires
    },
    is_used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Index for querying OTPs
otpSchema.index({ userId: 1, purpose: 1 });

// Create the OTP model
const otpModel = mongoose.model<IOtp>("OTP", otpSchema);

export default otpModel;
