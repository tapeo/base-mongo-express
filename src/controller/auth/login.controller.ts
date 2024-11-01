import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { setCookies } from "../../libs/cookie";
import { encrypt } from "../../libs/crypto";
import { generateAccessToken, generateRefreshToken } from "../../libs/jwt";
import { RefreshTokenService } from "../../services/refresh-token.service";
import { UserService } from "../../services/user.service";

export const loginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const sanitizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(sanitizedEmail)) {
    res.status(400).json({ message: "Invalid email" });
    return;
  }

  try {
    const user = await UserService.getUserByEmail(email);

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const accessToken = generateAccessToken(user.id.toString(), email);
      const refreshToken = generateRefreshToken(user.id.toString(), email);

      const encryptedRefreshToken = encrypt(refreshToken);

      await RefreshTokenService.post(user.id, encryptedRefreshToken);

      setCookies(accessToken, refreshToken, res);

      res.json({
        message: "Login successful, tokens saved as httpOnly cookie",
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const logoutHandler = async (req: Request, res: Response) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.json({ message: "Logout successful" });
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
