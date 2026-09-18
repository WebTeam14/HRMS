
import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  getCompanyDirectory as getCompanyDirectoryService,
} from "../services/employeeService";

import {
  employeeListQuerySchema,
} from "../validators/employeeValidator";

const handleEmployeeError = (
  error: unknown,
  res: Response,
  next: NextFunction
) => {
  if (!(error instanceof Error)) {
    return next(error);
  }

  const errorMap: Record<
    string,
    { status: number; message: string }
  > = {
    EMAIL_ALREADY_EXISTS: {
      status: 409,
      message:
        "An account with this email already exists",
    },

    DEPARTMENT_NOT_FOUND: {
      status: 404,
      message: "Department not found",
    },

    MANAGER_NOT_FOUND: {
      status: 404,
      message: "Manager not found",
    },

    EMPLOYEE_NOT_FOUND: {
      status: 404,
      message: "Employee not found",
    },

    INVALID_EMPLOYEE_ID: {
      status: 400,
      message: "Invalid employee ID",
    },

    INVALID_DEPARTMENT_ID: {
      status: 400,
      message: "Invalid department ID",
    },

    INVALID_MANAGER_ID: {
      status: 400,
      message: "Invalid manager ID",
    },

    EMPLOYEE_CANNOT_BE_OWN_MANAGER: {
      status: 400,
      message:
        "Employee cannot be their own manager",
    },
  };

  const matched =
    errorMap[error.message];

  if (matched) {
    return res.status(matched.status).json({
      success: false,
      message: matched.message,
      error: error.message,
    });
  }

  next(error);
};

export const createEmployeeController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const employee =
        await createEmployee(req.body);

      return res.status(201).json({
        success: true,
        message:
          "Employee created successfully",
        data: employee,
      });
    } catch (error) {
      handleEmployeeError(
        error,
        res,
        next
      );
    }
  };

export const listEmployees =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed =
        employeeListQuerySchema.parse(
          req.query
        );

      const result =
        await getEmployees(parsed);

      return res.status(200).json({
        success: true,
        data: result.employees,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

export const getEmployee =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const employee =
        await getEmployeeById(
          String(req.params.id)
        );

      return res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      handleEmployeeError(
        error,
        res,
        next
      );
    }
  };

export const editEmployee =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const employee =
        await updateEmployee(
          String(req.params.id),
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Employee updated successfully",
        data: employee,
      });
    } catch (error) {
      handleEmployeeError(
        error,
        res,
        next
      );
    }
  };

export const changeEmployeeStatus =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const employee =
        await updateEmployeeStatus(
          String(req.params.id),
          req.body.status
        );

      return res.status(200).json({
        success: true,
        message:
          "Employee status updated successfully",
        data: employee,
      });
    } catch (error) {
      handleEmployeeError(
        error,
        res,
        next
      );
    }
  };

export const getCompanyDirectory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, departmentId } = req.query as any;
    const directory = await getCompanyDirectoryService({ search, departmentId });

    return res.status(200).json({
      success: true,
      data: directory,
    });
  } catch (error) {
    handleEmployeeError(error, res, next);
  }
};