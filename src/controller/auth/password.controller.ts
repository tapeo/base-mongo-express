import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";
import {
  extensionSendEmail,
  SendEmailParams,
} from "../../extensions/send-email.extension";
import { User } from "../../model/user.model";

const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .jsonTyped({ status: "success", message: "User not found" });
  }

  const token = crypto.randomBytes(20).toString("hex");

  user.reset_password_token = token;
  user.reset_password_expires = new Date(Date.now() + 3600000);

  await user.save();

  const mailOptions: SendEmailParams = {
    from: {
      email: process.env.EMAIL_FROM!,
      name: process.env.NAME_FROM!,
    },
    email: user.email,
    subject: "Password Reset",
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                Please click on the following link, or paste this into your browser to complete the process:\n\n
                https://${req.headers.host}/password/reset/${token}\n\n
                If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    imageFile: undefined,
    nameFile: undefined,
  };

  await extensionSendEmail(mailOptions);

  res
    .status(200)
    .jsonTyped({ status: "success", message: "Password reset email sent" });
};

const tokenPassword = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({
      reset_password_token: req.params.token,
      reset_password_expires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Password reset token is invalid or has expired",
      });
    }

    res.redirect(`/reset-password.html?token=${req.params.token}`);
  } catch (error) {
    res
      .status(500)
      .jsonTyped({ status: "error", message: "Error in validating token" });
  }
};

const updatePassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Password reset token is invalid or has expired",
      });
    }

    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Passwords do not match",
      });
    }

    const passwordEncrypted = await bcrypt.hash(password, 10);

    user.password = passwordEncrypted;
    user.reset_password_token = null;
    user.reset_password_expires = null;

    await user.save();

    res
      .status(200)
      .jsonTyped({ status: "success", message: "Password has been updated" });
  } catch (error) {
    res.status(500).jsonTyped({
      status: "error",
      message: "Error in updating password",
    });
  }
};

export default {
  forgotPassword,
  tokenPassword,
  updatePassword,
};
