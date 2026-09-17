import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Employee } from "../models/Employee";
import { User } from "../models/User";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

export const getMyProfile = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  // Ensure an employee document exists for this user account
  const baseEmployee = await ensureEmployeeForUser(userId);

  const employee = await Employee.findById(baseEmployee._id)
    .populate("departmentId", "name code description")
    .populate("managerId", "employeeCode firstName lastName designation phone")
    .populate("userId", "email role isActive lastLoginAt");

  return employee || baseEmployee;
};

export const updateMyProfile = async (
  userId: string,
  input: UpdateProfileInput
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const employee = await ensureEmployeeForUser(userId);

  if (input.firstName !== undefined) {
    employee.firstName = input.firstName.trim();
  }

  if (input.lastName !== undefined) {
    employee.lastName = input.lastName.trim();
  }

  if (input.phone !== undefined) {
    employee.phone = input.phone.trim();
  }

  if (input.dateOfBirth !== undefined) {
    employee.dateOfBirth = input.dateOfBirth;
  }

  if (input.gender !== undefined) {
    employee.gender = input.gender;
  }

  await employee.save();

  return getMyProfile(userId);
};

export const changeMyPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const isCurrentValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isCurrentValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  user.passwordHash = newHash;
  await user.save();

  return { message: "Password updated successfully" };
};
