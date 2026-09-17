
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { Employee } from "../models/Employee";
import { User } from "../models/User";
import { Department } from "../models/Department";

interface CreateEmployeeInput {
  email: string;
  password: string;

  firstName: string;
  lastName?: string;

  phone?: string;
  dateOfBirth?: Date;

  gender?: "MALE" | "FEMALE" | "OTHER";

  departmentId?: string;
  managerId?: string;

  designation?: string;

  joiningDate: Date;

  employmentType:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN";

  workLocation?: string;
  monthlySalary?: number;
}

interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE" | "OTHER";

  departmentId?: string;
  managerId?: string;

  designation?: string;
  joiningDate?: Date;

  employmentType?:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN";

  workLocation?: string;
  monthlySalary?: number;
}

export interface EmployeeQuery {
  search?: string;
  departmentId?: string;
  status?: string;
  employmentType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const generateEmployeeCode = async (): Promise<string> => {
  const latestEmployee = await Employee.findOne()
    .sort({ employeeCode: -1 })
    .select("employeeCode");

  if (!latestEmployee) {
    return "EMP-1001";
  }

  const number = Number(
    latestEmployee.employeeCode.replace("EMP-", "")
  );

  return `EMP-${number + 1}`;
};

export const createEmployee = async (
  input: CreateEmployeeInput
) => {
  const normalizedEmail =
    input.email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  if (
    input.departmentId &&
    !mongoose.Types.ObjectId.isValid(input.departmentId)
  ) {
    throw new Error("INVALID_DEPARTMENT_ID");
  }

  if (
    input.managerId &&
    !mongoose.Types.ObjectId.isValid(input.managerId)
  ) {
    throw new Error("INVALID_MANAGER_ID");
  }

  if (input.departmentId) {
    const department = await Department.findOne({
      _id: input.departmentId,
      isActive: true,
    });

    if (!department) {
      throw new Error("DEPARTMENT_NOT_FOUND");
    }
  }

  if (input.managerId) {
    const manager = await Employee.findOne({
      _id: input.managerId,
      status: { $ne: "INACTIVE" },
    });

    if (!manager) {
      throw new Error("MANAGER_NOT_FOUND");
    }
  }

  const passwordHash = await bcrypt.hash(
    input.password,
    12
  );

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role: "EMPLOYEE",
    isActive: true,
  });

  try {
    const employeeCode =
      await generateEmployeeCode();

    const employee = await Employee.create({
      userId: user._id,
      employeeCode,

      firstName: input.firstName,
      lastName: input.lastName,

      phone: input.phone,
      dateOfBirth: input.dateOfBirth,

      gender: input.gender,

      departmentId: input.departmentId,
      managerId: input.managerId,

      designation: input.designation,

      joiningDate: input.joiningDate,

      employmentType: input.employmentType,

      workLocation: input.workLocation,
      monthlySalary: input.monthlySalary || 50000,

      status: "ACTIVE",
    });

    return getEmployeeById(employee._id.toString());
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
};

export const getEmployees = async (
  query: EmployeeQuery
) => {
  const {
    search = "",
    departmentId,
    status,
    employmentType,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter: any = {};

  if (status) {
    filter.status = status;
  }

  if (employmentType) {
    filter.employmentType = employmentType;
  }

  if (
    departmentId &&
    mongoose.Types.ObjectId.isValid(departmentId)
  ) {
    filter.departmentId = departmentId;
  }

  if (search.trim()) {
    filter.$or = [
      {
        firstName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        employeeCode: {
          $regex: search,
          $options: "i",
        },
      },
      {
        designation: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const allowedSortFields = [
    "createdAt",
    "joiningDate",
    "firstName",
    "employeeCode",
  ];

  const safeSortBy =
    allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

  const sortDirection =
    sortOrder === "asc" ? 1 : -1;

  const skip =
    (page - 1) * limit;

  const [employees, total] =
    await Promise.all([
      Employee.find(filter)
        .populate("departmentId", "name code")
        .populate(
          "managerId",
          "employeeCode firstName lastName designation"
        )
        .populate(
          "userId",
          "email role isActive"
        )
        .sort({
          [safeSortBy]: sortDirection,
        })
        .skip(skip)
        .limit(limit),

      Employee.countDocuments(filter),
    ]);

  return {
    employees,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEmployeeById = async (
  employeeId: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(employeeId)
  ) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const employee = await Employee.findById(employeeId)
    .populate(
      "departmentId",
      "name code description"
    )
    .populate(
      "managerId",
      "employeeCode firstName lastName designation"
    )
    .populate(
      "userId",
      "email role isActive lastLoginAt"
    );

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  return employee;
};

export const updateEmployee = async (
  employeeId: string,
  input: UpdateEmployeeInput
) => {
  if (
    !mongoose.Types.ObjectId.isValid(employeeId)
  ) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const employee =
    await Employee.findById(employeeId);

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  if (
    input.departmentId !== undefined &&
    input.departmentId !== ""
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(
        input.departmentId
      )
    ) {
      throw new Error("INVALID_DEPARTMENT_ID");
    }

    const department =
      await Department.findOne({
        _id: input.departmentId,
        isActive: true,
      });

    if (!department) {
      throw new Error("DEPARTMENT_NOT_FOUND");
    }

    employee.departmentId =
      new mongoose.Types.ObjectId(
        input.departmentId
      );
  }

  if (
    input.managerId !== undefined &&
    input.managerId !== ""
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(
        input.managerId
      )
    ) {
      throw new Error("INVALID_MANAGER_ID");
    }

    if (input.managerId === employeeId) {
      throw new Error(
        "EMPLOYEE_CANNOT_BE_OWN_MANAGER"
      );
    }

    const manager =
      await Employee.findOne({
        _id: input.managerId,
        status: { $ne: "INACTIVE" },
      });

    if (!manager) {
      throw new Error("MANAGER_NOT_FOUND");
    }

    employee.managerId =
      new mongoose.Types.ObjectId(
        input.managerId
      );
  }

  if (input.managerId === "") {
    employee.managerId = undefined;
  }

  if (input.departmentId === "") {
    employee.departmentId = undefined;
  }

  if (input.firstName !== undefined)
    employee.firstName = input.firstName;

  if (input.lastName !== undefined)
    employee.lastName = input.lastName;

  if (input.phone !== undefined)
    employee.phone = input.phone;

  if (input.dateOfBirth !== undefined)
    employee.dateOfBirth = input.dateOfBirth;

  if (input.gender !== undefined)
    employee.gender = input.gender;

  if (input.designation !== undefined)
    employee.designation = input.designation;

  if (input.joiningDate !== undefined)
    employee.joiningDate = input.joiningDate;

  if (input.employmentType !== undefined)
    employee.employmentType =
      input.employmentType;

  if (input.workLocation !== undefined)
    employee.workLocation =
      input.workLocation;

  if (input.monthlySalary !== undefined)
    employee.monthlySalary =
      input.monthlySalary;

  await employee.save();

  return getEmployeeById(employeeId);
};

export const updateEmployeeStatus = async (
  employeeId: string,
  status:
    | "ACTIVE"
    | "ON_LEAVE"
    | "NOTICE_PERIOD"
    | "INACTIVE"
) => {
  if (
    !mongoose.Types.ObjectId.isValid(employeeId)
  ) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const employee =
    await Employee.findById(employeeId);

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  employee.status = status;

  await employee.save();

  await User.findByIdAndUpdate(
    employee.userId,
    {
      isActive:
        status !== "INACTIVE",
    }
  );

  return getEmployeeById(employeeId);
};

export const getCompanyDirectory = async (query: {
  search?: string;
  departmentId?: string;
}) => {
  const filter: any = { status: { $ne: "INACTIVE" } };

  if (query.departmentId) {
    filter.departmentId = query.departmentId;
  }

  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { firstName: { $regex: s, $options: "i" } },
      { lastName: { $regex: s, $options: "i" } },
      { designation: { $regex: s, $options: "i" } },
      { employeeCode: { $regex: s, $options: "i" } },
    ];
  }

  return Employee.find(filter)
    .populate("departmentId", "name code")
    .populate("managerId", "employeeCode firstName lastName designation")
    .populate("userId", "email role")
    .sort({ firstName: 1 });
};