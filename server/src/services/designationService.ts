import mongoose from "mongoose";
import { Designation } from "../models/Designation";
import { Department } from "../models/Department";

export interface CreateDesignationInput {
  name: string;
  code?: string;
  departmentId?: string;
  description?: string;
}

export interface UpdateDesignationInput {
  name?: string;
  code?: string;
  departmentId?: string;
  description?: string;
  isActive?: boolean;
}

export interface DesignationQuery {
  search?: string;
  departmentId?: string;
  isActive?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const createDesignation = async (input: CreateDesignationInput) => {
  const normalizedName = input.name.trim();
  const normalizedCode = input.code?.toUpperCase().trim();

  let deptObjectId: mongoose.Types.ObjectId | undefined = undefined;

  if (input.departmentId && input.departmentId !== "") {
    if (!mongoose.Types.ObjectId.isValid(input.departmentId)) {
      throw new Error("INVALID_DEPARTMENT_ID");
    }

    const department = await Department.findOne({
      _id: input.departmentId,
      isActive: true,
    });

    if (!department) {
      throw new Error("DEPARTMENT_NOT_FOUND");
    }

    deptObjectId = new mongoose.Types.ObjectId(input.departmentId);
  }

  // Prevent duplicate designation name within the same department
  const duplicateQuery: any = {
    name: { $regex: `^${normalizedName}$`, $options: "i" },
  };

  if (deptObjectId) {
    duplicateQuery.departmentId = deptObjectId;
  } else {
    duplicateQuery.$or = [
      { departmentId: { $exists: false } },
      { departmentId: null },
    ];
  }

  const existing = await Designation.findOne(duplicateQuery);
  if (existing) {
    throw new Error("DESIGNATION_NAME_EXISTS");
  }

  const designation = await Designation.create({
    name: normalizedName,
    code: normalizedCode || undefined,
    departmentId: deptObjectId,
    description: input.description?.trim(),
    isActive: true,
  });

  return getDesignationById(designation._id.toString());
};

export const getDesignations = async (query: DesignationQuery = {}) => {
  const {
    search = "",
    departmentId,
    isActive,
    status,
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
  } = query;

  const filter: any = {};

  if (departmentId && departmentId !== "" && mongoose.Types.ObjectId.isValid(departmentId)) {
    filter.departmentId = new mongoose.Types.ObjectId(departmentId);
  }

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

  const [designations, total] = await Promise.all([
    Designation.find(filter)
      .populate("departmentId", "name code")
      .sort({ [safeSortBy]: sortDirection })
      .skip(skip)
      .limit(limit),
    Designation.countDocuments(filter),
  ]);

  return {
    designations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getDesignationById = async (designationId: string) => {
  if (!mongoose.Types.ObjectId.isValid(designationId)) {
    throw new Error("INVALID_DESIGNATION_ID");
  }

  const designation = await Designation.findById(designationId).populate(
    "departmentId",
    "name code description"
  );

  if (!designation) {
    throw new Error("DESIGNATION_NOT_FOUND");
  }

  return designation;
};

export const updateDesignation = async (
  designationId: string,
  input: UpdateDesignationInput
) => {
  if (!mongoose.Types.ObjectId.isValid(designationId)) {
    throw new Error("INVALID_DESIGNATION_ID");
  }

  const designation = await Designation.findById(designationId);
  if (!designation) {
    throw new Error("DESIGNATION_NOT_FOUND");
  }

  let deptObjectId: mongoose.Types.ObjectId | null | undefined =
    designation.departmentId;

  if (input.departmentId !== undefined) {
    if (input.departmentId === "") {
      deptObjectId = null;
    } else {
      if (!mongoose.Types.ObjectId.isValid(input.departmentId)) {
        throw new Error("INVALID_DEPARTMENT_ID");
      }

      const department = await Department.findOne({
        _id: input.departmentId,
        isActive: true,
      });

      if (!department) {
        throw new Error("DEPARTMENT_NOT_FOUND");
      }

      deptObjectId = new mongoose.Types.ObjectId(input.departmentId);
    }
  }

  const targetName = input.name !== undefined ? input.name.trim() : designation.name;

  // Check duplicate designation name in target department
  const duplicateQuery: any = {
    _id: { $ne: designationId },
    name: { $regex: `^${targetName}$`, $options: "i" },
  };

  if (deptObjectId) {
    duplicateQuery.departmentId = deptObjectId;
  } else {
    duplicateQuery.$or = [
      { departmentId: { $exists: false } },
      { departmentId: null },
    ];
  }

  const existing = await Designation.findOne(duplicateQuery);
  if (existing) {
    throw new Error("DESIGNATION_NAME_EXISTS");
  }

  if (input.name !== undefined) {
    designation.name = targetName;
  }

  if (input.code !== undefined) {
    designation.code = input.code ? input.code.toUpperCase().trim() : undefined;
  }

  if (input.departmentId !== undefined) {
    designation.departmentId = deptObjectId || undefined;
  }

  if (input.description !== undefined) {
    designation.description = input.description.trim();
  }

  if (input.isActive !== undefined) {
    designation.isActive = input.isActive;
  }

  await designation.save();

  return getDesignationById(designationId);
};

export const updateDesignationStatus = async (
  designationId: string,
  isActive: boolean
) => {
  if (!mongoose.Types.ObjectId.isValid(designationId)) {
    throw new Error("INVALID_DESIGNATION_ID");
  }

  const designation = await Designation.findById(designationId);
  if (!designation) {
    throw new Error("DESIGNATION_NOT_FOUND");
  }

  designation.isActive = isActive;
  await designation.save();

  return getDesignationById(designationId);
};
