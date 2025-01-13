import { model, Schema } from "mongoose";

export interface IRefreshToken {
  expires_at: Date;
  encrypted_jwt: string;
}

export const RefreshTokenSchema = new Schema<IRefreshToken>({
  expires_at: {
    type: Date,
    required: true,
  },
  encrypted_jwt: {
    type: String,
    required: true,
  },
});

export interface IUser {
  _id: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
  reset_password_token: string;
  reset_password_expires: string;
  picture_url: string;
  id_stripe_customer: string;
  id_stripe_connect: string;
  refresh_tokens: IRefreshToken[];
  name?: string | null;
  user_type?: string | null;
}

export const UserSchema = new Schema({
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
  user_type: {
    type: String,
    default: null,
  },
});

export const User = model("User", UserSchema);
