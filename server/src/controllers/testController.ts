import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";

export const employeeTest = (
  req: AuthenticatedRequest,
  res: Response
) => {
  res.status(200).json({
    success: true,
    message: "Employee access granted",
    user: req.user,
  });
};

export const payrollTest = (
  req: AuthenticatedRequest,
  res: Response
) => {
  res.status(200).json({
    success: true,
    message: "Payroll access granted",
    user: req.user,
  });
};

export const hrTest = (
  req: AuthenticatedRequest,
  res: Response
) => {
  res.status(200).json({
    success: true,
    message: "HR/Admin access granted",
    user: req.user,
  });
};