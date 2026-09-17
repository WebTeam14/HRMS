import { Request, Response, NextFunction } from "express";
import {
  createDesignation,
  getDesignations,
  getDesignationById,
  updateDesignation,
  updateDesignationStatus,
} from "../services/designationService";
import { designationListQuerySchema } from "../validators/designationValidator";

const handleDesignationError = (
  error: unknown,
  res: Response,
  next: NextFunction
) => {
  if (!(error instanceof Error)) {
    return next(error);
  }

  const errorMap: Record<string, { status: number; message: string }> = {
    DESIGNATION_NAME_EXISTS: {
      status: 409,
      message:
        "A designation with this name already exists in the selected department",
    },
    DESIGNATION_NOT_FOUND: {
      status: 404,
      message: "Designation not found",
    },
    INVALID_DESIGNATION_ID: {
      status: 400,
      message: "Invalid designation ID",
    },
    DEPARTMENT_NOT_FOUND: {
      status: 404,
      message: "Department not found or is inactive",
    },
    INVALID_DEPARTMENT_ID: {
      status: 400,
      message: "Invalid department ID",
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

export const createDesignationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designation = await createDesignation(req.body);

    return res.status(201).json({
      success: true,
      message: "Designation created successfully",
      data: designation,
    });
  } catch (error) {
    handleDesignationError(error, res, next);
  }
};

export const listDesignations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = designationListQuerySchema.parse(req.query);
    const result = await getDesignations(parsed);

    return res.status(200).json({
      success: true,
      data: result.designations,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designation = await getDesignationById(String(req.params.id));

    return res.status(200).json({
      success: true,
      data: designation,
    });
  } catch (error) {
    handleDesignationError(error, res, next);
  }
};

export const editDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designation = await updateDesignation(
      String(req.params.id),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Designation updated successfully",
      data: designation,
    });
  } catch (error) {
    handleDesignationError(error, res, next);
  }
};

export const changeDesignationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designation = await updateDesignationStatus(
      String(req.params.id),
      req.body.isActive
    );

    return res.status(200).json({
      success: true,
      message: `Designation ${
        req.body.isActive ? "activated" : "deactivated"
      } successfully`,
      data: designation,
    });
  } catch (error) {
    handleDesignationError(error, res, next);
  }
};
