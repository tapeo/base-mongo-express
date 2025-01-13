import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { decrypt, encrypt } from "../../libs/crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_SECRET,
} from "../../libs/jwt";
import { RefreshTokenService } from "../../services/refresh-token.service";

export const refreshTokenHandler = async (req: Request, res: Response) => {
  const refreshToken = req.body.refresh_token;

  let idUser;
  let email;
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    idUser = (decoded as any)["x-user-id"];
    email = (decoded as any)["x-email"];
  } catch (err) {
    res.status(401).json({ message: "Unauthorized, invalid token" });
    return;
  }

  if (!idUser) {
    res.status(404).json({ message: "Unauthorized, user not found" });
    return;
  }

  const refreshTokenList = await RefreshTokenService.getByUserId(idUser);

  if (refreshTokenList.length === 0) {
    res.status(401).json({ message: "Unauthorized, no refresh tokens" });
    return;
  }

  let tokenFoundEncrypted: string | null = null;
  let tokenFoundDecrypted: string | null = null;

  for (const token of refreshTokenList) {
    const decryptedRefreshToken = decrypt(token.encrypted_jwt);

    if (decryptedRefreshToken === refreshToken) {
      tokenFoundEncrypted = token.encrypted_jwt;
      tokenFoundDecrypted = decryptedRefreshToken;
      break;
    }
  }

  if (!tokenFoundEncrypted || !tokenFoundDecrypted) {
    res.status(401).json({ message: "Unauthorized, no valid token" });
    return;
  }

  const accessToken = generateAccessToken(idUser, email);
  const newRefreshToken = generateRefreshToken(idUser, email);

  const encryptedRefreshToken = encrypt(newRefreshToken);

  await RefreshTokenService.delete(idUser, tokenFoundEncrypted);
  await RefreshTokenService.post(idUser, encryptedRefreshToken);

  res.status(200).json({
    access_token: accessToken,
    refresh_token: newRefreshToken,
  });
};
