import { Request, Response } from "express";
import {
  extensionSendEmail,
  SendEmailParams,
} from "../../extensions/send-email.extension";
import otpModel, { OtpPurpose } from "../../model/otp.model";
import { UserService } from "../../services/user.service";

/**
 * Generate a random numeric OTP of specified length
 */
const generateOTP = (length: number = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
};

/**
 * Generate and save new OTP
 */
export const generateOTPHandler = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Email and purpose are required",
      data: null,
    });
  }

  const user = await UserService.getUserByEmail(email);

  // Delete any existing unused OTPs for this user and purpose
  await otpModel.deleteMany({
    user_id: user.id,
    purpose,
    is_used: false,
  });

  // Generate new OTP
  const otp = generateOTP();

  // OTP expires in 10 minutes
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  // Save OTP to database
  await otpModel.create({
    user_id: user.id,
    otp,
    purpose,
    expires_at,
  });

  const mailOptions: SendEmailParams = {
    from: {
      email: process.env.EMAIL_FROM!,
      name: process.env.NAME_FROM!,
    },
    email: user.email,
    subject: "Verification Code",
    text: `Your verification code is: ${otp}`,
    imageFile: undefined,
    nameFile: undefined,
  };

  await extensionSendEmail(mailOptions);

  return res.status(200).jsonTyped({
    status: "success",
    message: "OTP sent successfully",
  });
};

/**
 * Verify OTP
 */
export const verifyOTPHandler = async (req: Request, res: Response) => {
  const { email, otp, purpose } = req.body;

  if (!email || !otp || !purpose) {
    return res.status(400).jsonTyped({
      status: "error",
      message: "Email, OTP, and purpose are required",
      data: null,
    });
  }

  const user = await UserService.getUserByEmail(email);

  const otpDoc = await otpModel.findOne({
    user_id: user.id,
    otp,
    purpose,
    is_used: false,
    expires_at: { $gt: new Date() },
  });

  if (!otpDoc) {
    return res.status(400).json({
      status: "error",
      message: "Invalid or expired OTP",
      data: null,
    });
  }

  // Mark OTP as used
  otpDoc.is_used = true;
  await otpDoc.save();

  // Handle specific OTP purposes
  switch (purpose) {
    case OtpPurpose.EMAIL_VERIFICATION:
      await UserService.verifyEmail(user.id);
      break;
    case OtpPurpose.TWO_FACTOR:
      throw new Error("Two factor not implemented");
    default:
      throw new Error("Invalid OTP purpose");
  }

  return res.status(200).jsonTyped({
    status: "success",
    message: "OTP verified successfully",
  });
};
