import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { generateAccessToken } from "../utils/jwt";

interface LoginInput {
  emailOrEmployeeId: string;
  password: string;
}

export const loginUser = async ({
  emailOrEmployeeId,
  password,
}: LoginInput) => {
  const user = await User.findOne({
    email: emailOrEmployeeId.toLowerCase(),
  }).select("+passwordHash");

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new Error("ACCOUNT_INACTIVE");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  user.lastLoginAt = new Date();

  await user.save();

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return {
    accessToken,

    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  };
};