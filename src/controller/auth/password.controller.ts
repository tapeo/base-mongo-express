import axios from "axios";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";
import fs from "fs";
import { User } from "../../model/user.model";
import { config } from "../../sample.config";

const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
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

    const mailOptions: EmailOptions = {
      fromEmail: config.email,
      fromName: config.name,
      toEmail: user.email,
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                Please click on the following link, or paste this into your browser to complete the process:\n\n
                https://${req.headers.host}/password/reset/${token}\n\n
                If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await sendEmail(mailOptions);

    res
      .status(200)
      .jsonTyped({ status: "success", message: "Password reset email sent" });
  } catch (error) {
    res
      .status(500)
      .jsonTyped({ status: "error", message: "Error in sending email" });
  }
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

interface EmailOptions {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  text: string;
  imageFile?: Express.Multer.File;
}

const sendEmail = async (emailOptions: EmailOptions) => {
  const { fromEmail, fromName, toEmail, subject, text, imageFile } =
    emailOptions;

  try {
    const html = text.split("\n").join("<br />");
    let attachments = [];

    if (imageFile) {
      const base64Image = fs.readFileSync(imageFile.path, {
        encoding: "base64",
      });
      attachments.push({
        content: base64Image,
        filename: imageFile.originalname,
      });
    }

    const body = {
      from: { email: fromEmail, name: fromName },
      to: [{ email: toEmail }],
      subject,
      html,
      attachments,
    };

    const apiKey = process.env.MAILERSEND_API_KEY!;
    const apiUrl = "https://api.mailersend.com/v1/email";

    const response = await axios.post(apiUrl, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (imageFile) {
      fs.unlinkSync(imageFile.path);
    }

    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
