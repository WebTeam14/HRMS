import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Employee } from "../models/Employee";
import { generateAccessToken } from "../utils/jwt";

interface LoginInput {
  emailOrEmployeeId: string;
  password: string;
}

export const loginUser = async ({
  emailOrEmployeeId,
  password,
}: LoginInput) => {
  const cleanInput = emailOrEmployeeId.trim();

  let user = await User.findOne({
    email: cleanInput.toLowerCase(),
  }).select("+passwordHash");

  if (!user) {
    const code = cleanInput.toUpperCase();
    const formattedCode = code.includes("-")
      ? code
      : code.replace(/^EMP/, "EMP-");

    const employee = await Employee.findOne({
      $or: [
        { employeeCode: code },
        { employeeCode: formattedCode },
      ],
    });

    if (employee && employee.userId) {
      user = await User.findById(employee.userId).select(
        "+passwordHash"
      );
    }
  }

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