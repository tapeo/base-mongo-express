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

  if (!email) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Email is required",
      data: null,
    });
  }

  // Delete any existing unused OTPs for this user and purpose
  await otpModel.deleteMany({
    email,
    purpose: OtpPurpose.EMAIL_VERIFICATION,
    is_used: false,
  });

  // Generate new OTP
  const otp = generateOTP();

  // OTP expires in 10 minutes
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  // Save OTP to database
  await otpModel.create({
    email,
    otp,
    purpose: OtpPurpose.EMAIL_VERIFICATION,
    expires_at,
  });

  const mailOptions: SendEmailParams = {
    from: {
      email: process.env.EMAIL_FROM!,
      name: process.env.NAME_FROM!,
    },
    email,
    subject: "Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <p>Welcome to ${process.env.NAME_FROM}!</p>
        
        <p>Your verification code is:</p>
        
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 3px;">
          ${otp}
        </div>
        
        <p>Code expires in 10 minutes.</p>
        
        <p>${process.env.NAME_FROM} Team</p>
      </div>
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

export const signupHandler = async (
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

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (!isValidEmail(email)) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Invalid email",
      data: null,
    });
  }

  const otpDoc = await otpModel.findOne({
    email,
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

  const passwordEncrypted = await bcrypt.hash(password, 10);

  try {
    const user = await UserService.post(email, passwordEncrypted);

    await extensionSendTelegramBotMessage({
      content: `New user registered: ${email} on ${process.env.DOMAIN}`,
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
