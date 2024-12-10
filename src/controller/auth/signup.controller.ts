import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { extensionSendTelegramBotMessage } from "../../extensions/telegram.extension";
import otpModel, { OtpPurpose } from "../../model/otp.model";
import { UserService } from "../../services/user.service";

import {
  extensionSendEmail,
  SendEmailParams,
} from "../../extensions/send-email.extension";

const generateOTP = (length: number = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
};

export const sendEmailVerificationHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  const sanitizedEmail = email.trim().toLowerCase();

  if (!sanitizedEmail) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Email is required",
      data: null,
    });
  }

  // Delete any existing unused OTPs for this user and purpose
  await otpModel.deleteMany({
    email: sanitizedEmail,
    purpose: OtpPurpose.EMAIL_VERIFICATION,
    is_used: false,
  });

  // Generate new OTP
  const otp = generateOTP();

  // OTP expires in 10 minutes
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  // Save OTP to database
  await otpModel.create({
    email: sanitizedEmail,
    otp,
    purpose: OtpPurpose.EMAIL_VERIFICATION,
    expires_at,
  });

  const mailOptions: SendEmailParams = {
    from: {
      email: process.env.EMAIL_FROM!,
      name: process.env.NAME_FROM!,
    },
    email: sanitizedEmail,
    subject: "Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Welcome to ${process.env.NAME_FROM}!</p>
        
        <p>Your verification code is: <strong>${otp}</strong></p>
        
        <p>This code will expire in 10 minutes.</p>
        
        <p>Best regards,<br>${process.env.NAME_FROM} Team</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You received this email because you signed up for ${process.env.NAME_FROM}. 
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `
Welcome to ${process.env.NAME_FROM}!

Your verification code is: ${otp}

This code will expire in 10 minutes.

Best regards,
${process.env.NAME_FROM} Team

---
You received this email because you signed up for ${process.env.NAME_FROM}. 
If you didn't request this, you can safely ignore this email.
    `,
    imageFile: undefined,
    nameFile: undefined,
  };

  await extensionSendEmail(mailOptions);

  return res.status(200).jsonTyped({
    status: "success",
    message: "OTP sent successfully",
  });
};

export const signupWithVerificationHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password, otp } = req.body;

  if (!email || !password || !otp) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Email, password and OTP are required",
      data: null,
    });
  }

  const sanitizedEmail = email.trim().toLowerCase();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (!isValidEmail(sanitizedEmail)) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Invalid email",
      data: null,
    });
  }

  const otpDoc = await otpModel.findOne({
    email: sanitizedEmail,
    otp,
    purpose: OtpPurpose.EMAIL_VERIFICATION,
    is_used: false,
    expires_at: { $gt: new Date() },
  });

  if (!otpDoc) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Invalid or expired OTP",
      data: null,
    });
  }

  otpDoc.is_used = true;
  await otpDoc.save();

  return await createUserAccount(sanitizedEmail, password, res);
};

export const signupWithoutVerificationHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Email and password are required",
      data: null,
    });
  }

  const sanitizedEmail = email.trim().toLowerCase();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (!isValidEmail(sanitizedEmail)) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Invalid email",
      data: null,
    });
  }

  return await createUserAccount(sanitizedEmail, password, res);
};

// Helper function to create user account
const createUserAccount = async (
  email: string,
  password: string,
  res: Response
): Promise<void> => {
  const passwordEncrypted = await bcrypt.hash(password, 10);

  const sanitizedEmail = email.trim().toLowerCase();

  try {
    const user = await UserService.post(sanitizedEmail, passwordEncrypted);

    await extensionSendTelegramBotMessage({
      content: `New user registered: ${sanitizedEmail} on ${process.env.DOMAIN}`,
    });

    return res.status(200).jsonTyped({
      status: "success",
      message: "Registration successful, now you can login",
      data: {
        id: user.id,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).jsonTyped({
      status: "error",
      message: (error as Error).message,
      data: null,
    });
  }
};
