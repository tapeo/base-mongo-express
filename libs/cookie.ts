import { Response } from "express";

export const JWT_EXPIRATION_TIME = 3600000;
export const REFRESH_TOKEN_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

export const setCookies = (
  accessToken: string,
  refreshToken: string,
  res: Response
) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("access_token", accessToken, {
    domain: isProduction ? process.env.DOMAIN : undefined,
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: JWT_EXPIRATION_TIME,
  });

  res.cookie("refresh_token", refreshToken, {
    domain: isProduction ? process.env.DOMAIN : undefined,
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: REFRESH_TOKEN_EXPIRATION_TIME,
  });
};

export const clearCookies = (res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("access_token", "", {
    domain: isProduction ? process.env.DOMAIN : undefined,
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
  });

  res.cookie("refresh_token", "", {
    domain: isProduction ? process.env.DOMAIN : undefined,
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
  });
};
