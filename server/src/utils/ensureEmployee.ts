import mongoose from "mongoose";
import { Employee, IEmployee } from "../models/Employee";
import { User } from "../models/User";

/**
 * Ensures that an Employee document exists for the given User ID.
 * If none exists (e.g. newly registered user or demo user), automatically creates a default active profile.
 */
export const ensureEmployeeForUser = async (
  userId: string | mongoose.Types.ObjectId
): Promise<IEmployee> => {
  const userObjectId =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  let employee = await Employee.findOne({ userId: userObjectId });

  if (!employee) {
    const user = await User.findById(userObjectId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const emailPrefix = user.email.split("@")[0];
    const capitalizedName =
      emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    employee = await Employee.create({
      userId: user._id,
      employeeCode: `EMP-${randomSuffix}`,
      firstName: capitalizedName,
      lastName: "Member",
      designation: user.role === "EMPLOYEE" ? "Software Engineer" : user.role,
      joiningDate: new Date(),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
    });
  }

  return employee;
};
