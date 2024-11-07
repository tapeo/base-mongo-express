import { Response } from "express";

export const JWT_EXPIRATION_TIME = 3600000;
export const REFRESH_TOKEN_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

export const setCookies = (
  accessToken: string,
  refreshToken: string,
  res: Response
) => {
  res.cookie("access_token", accessToken, {
    domain: process.env.DOMAIN,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: JWT_EXPIRATION_TIME,
  });

  res.cookie("refresh_token", refreshToken, {
    domain: process.env.DOMAIN,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: REFRESH_TOKEN_EXPIRATION_TIME,
  });
};

export const clearCookies = (res: Response) => {
  res.cookie("access_token", "", {
    domain: process.env.DOMAIN,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(0),
  });

  res.cookie("refresh_token", "", {
    domain: process.env.DOMAIN,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(0),
  });
};
