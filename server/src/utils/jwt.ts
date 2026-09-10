import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "./roles";

interface AccessTokenPayload {
  userId: string;
  role: Role;
}

export const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    }
  );
};

export const verifyAccessToken = (
  token: string
): AccessTokenPayload => {
  return jwt.verify(
    token,
    env.JWT_ACCESS_SECRET
  ) as AccessTokenPayload;
};

