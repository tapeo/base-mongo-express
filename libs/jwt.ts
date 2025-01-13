import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export function verifyJWT(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

export function jwtDecode(token: string): jwt.JwtPayload | null | string {
  return jwt.decode(token);
}

export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    {
      "x-user-id": userId,
      "x-email": email,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m",
    }
  );
}

export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    {
      "x-user-id": userId,
      "x-email": email,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" }
  );
}
