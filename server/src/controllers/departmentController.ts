import { Request, Response, NextFunction } from "express";
import { getDepartments } from "../services/departmentService";

export const listDepartments = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const departments = await getDepartments();

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};