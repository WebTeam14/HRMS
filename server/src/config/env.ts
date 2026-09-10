import dotenv from "dotenv";

dotenv.config();

const requiredEnvVariables = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Environment variable ${variable} is missing: ${variable}`);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",

  PORT: Number(process.env.PORT) || 5000,

  CLIENT_URL:
    process.env.CLIENT_URL || "http://localhost:5173",

  MONGODB_URI: process.env.MONGODB_URI as string,

  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET as string,

  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET as string,

  ACCESS_TOKEN_EXPIRES_IN:
    process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",

  REFRESH_TOKEN_EXPIRES_IN:
    process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
};