import { Request, Response, NextFunction } from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  updateDepartmentStatus,
} from "../services/departmentService";
import { departmentListQuerySchema } from "../validators/departmentValidator";

const handleDepartmentError = (
  error: unknown,
  res: Response,
  next: NextFunction
) => {
  if (!(error instanceof Error)) {
    return next(error);
  }

  const errorMap: Record<string, { status: number; message: string }> = {
    DEPARTMENT_NAME_EXISTS: {
      status: 409,
      message: "A department with this name already exists",
    },
    DEPARTMENT_CODE_EXISTS: {
      status: 409,
      message: "A department with this code already exists",
    },
    DEPARTMENT_NOT_FOUND: {
      status: 404,
      message: "Department not found",
    },
    INVALID_DEPARTMENT_ID: {
      status: 400,
      message: "Invalid department ID",
    },
    MANAGER_NOT_FOUND: {
      status: 404,
      message: "Manager not found or is inactive",
    },
    INVALID_MANAGER_ID: {
      status: 400,
      message: "Invalid manager ID",
    },
  };

  const matched = errorMap[error.message];
  if (matched) {
    return res.status(matched.status).json({
      success: false,
      message: matched.message,
      error: error.message,
    });
  }

  next(error);
};

export const createDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const department = await createDepartment(req.body);

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    handleDepartmentError(error, res, next);
  }
};

export const listDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = departmentListQuerySchema.parse(req.query);
    const result = await getDepartments(parsed);

    return res.status(200).json({
      success: true,
      data: result.departments,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const department = await getDepartmentById(String(req.params.id));

    return res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    handleDepartmentError(error, res, next);
  }
};

export const editDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const department = await updateDepartment(
      String(req.params.id),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    handleDepartmentError(error, res, next);
  }
};

export const changeDepartmentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const department = await updateDepartmentStatus(
      String(req.params.id),
      req.body.isActive
    );

    return res.status(200).json({
      success: true,
      message: `Department ${
        req.body.isActive ? "activated" : "deactivated"
      } successfully`,
      data: department,
    });
  } catch (error) {
    handleDepartmentError(error, res, next);
  }
};