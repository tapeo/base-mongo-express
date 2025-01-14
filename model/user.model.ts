import { model, Schema } from "mongoose";

export interface RefreshToken {
  expires_at: Date;
  encrypted_jwt: string;
}

export interface User {
  _id: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  reset_password_token: string | null;
  reset_password_expires: Date | null;
  picture_url: string;
  id_stripe_customer: string;
  id_stripe_connect: string;
  refresh_tokens: RefreshToken[];
  name?: string | null;
  type?: string | null;
}

export const RefreshTokenSchema = new Schema<RefreshToken>({
  expires_at: {
    type: Date,
    required: true,
  },
  encrypted_jwt: {
    type: String,
    required: true,
  },
});

export const UserSchema = new Schema<User>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  reset_password_token: {
    type: String,
  },
  reset_password_expires: {
    type: Date,
  },
  picture_url: {
    type: String,
    default: null,
  },
  id_stripe_customer: {
    type: String,
  },
  id_stripe_connect: {
    type: String,
  },
  refresh_tokens: [RefreshTokenSchema],
  name: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: null,
  },
});

export const User = model("User", UserSchema);
