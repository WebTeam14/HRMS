import mongoose from "mongoose";
import { Department } from "../models/Department";
import { Employee } from "../models/Employee";

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  managerId?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface DepartmentQuery {
  search?: string;
  isActive?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const createDepartment = async (input: CreateDepartmentInput) => {
  const normalizedName = input.name.trim();
  const normalizedCode = input.code.toUpperCase().trim();

  // Check duplicate name (case-insensitive)
  const existingName = await Department.findOne({
    name: { $regex: `^${normalizedName}$`, $options: "i" },
  });

  if (existingName) {
    throw new Error("DEPARTMENT_NAME_EXISTS");
  }

  // Check duplicate code
  const existingCode = await Department.findOne({
    code: normalizedCode,
  });

  if (existingCode) {
    throw new Error("DEPARTMENT_CODE_EXISTS");
  }

  // Validate manager if provided
  if (input.managerId && input.managerId !== "") {
    if (!mongoose.Types.ObjectId.isValid(input.managerId)) {
      throw new Error("INVALID_MANAGER_ID");
    }

    const manager = await Employee.findOne({
      _id: input.managerId,
      status: { $ne: "INACTIVE" },
    });

    if (!manager) {
      throw new Error("MANAGER_NOT_FOUND");
    }
  }

  const department = await Department.create({
    name: normalizedName,
    code: normalizedCode,
    description: input.description?.trim(),
    managerId:
      input.managerId && input.managerId !== ""
        ? new mongoose.Types.ObjectId(input.managerId)
        : undefined,
    isActive: true,
  });

  return getDepartmentById(department._id.toString());
};

export const getDepartments = async (query: DepartmentQuery = {}) => {
  const {
    search = "",
    isActive,
    status,
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
  } = query;

  const filter: any = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  } else if (status) {
    const s = status.toLowerCase();
    if (s === "active") {
      filter.isActive = true;
    } else if (s === "inactive") {
      filter.isActive = false;
    }
  }

  if (search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    filter.$or = [{ name: searchRegex }, { code: searchRegex }];
  }

  const allowedSortFields = ["name", "code", "createdAt"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "name";
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  const [departments, total] = await Promise.all([
    Department.find(filter)
      .populate("managerId", "employeeCode firstName lastName designation")
      .sort({ [safeSortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Department.countDocuments(filter),
  ]);

  // Aggregate employee counts for the returned departments
  const deptIds = departments.map((d) => d._id);
  const employeeCounts = await Employee.aggregate([
    {
      $match: {
        departmentId: { $in: deptIds },
      },
    },
    {
      $group: {
        _id: "$departmentId",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map<string, number>();
  employeeCounts.forEach((ec) => {
    countMap.set(ec._id.toString(), ec.count);
  });

  const departmentsWithCount = departments.map((dept) => ({
    ...dept,
    employeeCount: countMap.get(dept._id.toString()) || 0,
  }));

  return {
    departments: departmentsWithCount,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getDepartmentById = async (departmentId: string) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("INVALID_DEPARTMENT_ID");
  }

  const department = await Department.findById(departmentId)
    .populate("managerId", "employeeCode firstName lastName designation phone")
    .lean();

  if (!department) {
    throw new Error("DEPARTMENT_NOT_FOUND");
  }

  const employeeCount = await Employee.countDocuments({
    departmentId: department._id,
  });

  return {
    ...department,
    employeeCount,
  };
};

export const updateDepartment = async (
  departmentId: string,
  input: UpdateDepartmentInput
) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("INVALID_DEPARTMENT_ID");
  }

  const department = await Department.findById(departmentId);

  if (!department) {
    throw new Error("DEPARTMENT_NOT_FOUND");
  }

  if (input.name !== undefined) {
    const normalizedName = input.name.trim();
    const existingName = await Department.findOne({
      _id: { $ne: departmentId },
      name: { $regex: `^${normalizedName}$`, $options: "i" },
    });

    if (existingName) {
      throw new Error("DEPARTMENT_NAME_EXISTS");
    }
    department.name = normalizedName;
  }

  if (input.code !== undefined) {
    const normalizedCode = input.code.toUpperCase().trim();
    const existingCode = await Department.findOne({
      _id: { $ne: departmentId },
      code: normalizedCode,
    });

    if (existingCode) {
      throw new Error("DEPARTMENT_CODE_EXISTS");
    }
    department.code = normalizedCode;
  }

  if (input.description !== undefined) {
    department.description = input.description.trim();
  }

  if (input.managerId !== undefined) {
    if (input.managerId === "") {
      department.managerId = undefined;
    } else {
      if (!mongoose.Types.ObjectId.isValid(input.managerId)) {
        throw new Error("INVALID_MANAGER_ID");
      }

      const manager = await Employee.findOne({
        _id: input.managerId,
        status: { $ne: "INACTIVE" },
      });

      if (!manager) {
        throw new Error("MANAGER_NOT_FOUND");
      }

      department.managerId = new mongoose.Types.ObjectId(input.managerId);
    }
  }

  if (input.isActive !== undefined) {
    department.isActive = input.isActive;
  }

  await department.save();

  return getDepartmentById(departmentId);
};

export const updateDepartmentStatus = async (
  departmentId: string,
  isActive: boolean
) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("INVALID_DEPARTMENT_ID");
  }

  const department = await Department.findById(departmentId);

  if (!department) {
    throw new Error("DEPARTMENT_NOT_FOUND");
  }

  department.isActive = isActive;
  await department.save();

  return getDepartmentById(departmentId);
};
