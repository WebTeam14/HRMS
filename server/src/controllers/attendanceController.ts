import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { Employee } from "../models/Employee";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getEmployeeAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
} from "../services/attendanceService";
import {
  attendanceQuerySchema,
  attendanceHistoryQuerySchema,
  updateAttendanceSchema,
} from "../validators/attendanceValidator";

const handleAttendanceError = (
  error: unknown,
  res: Response,
  next: NextFunction
) => {
  if (!(error instanceof Error)) {
    return next(error);
  }

  const errorMap: Record<string, { status: number; message: string }> = {
    ALREADY_CHECKED_IN: {
      status: 409,
      message: "You have already checked in today",
    },
    NOT_CHECKED_IN: {
      status: 400,
      message: "No check-in record found for today",
    },
    ALREADY_CHECKED_OUT: {
      status: 409,
      message: "You have already checked out today",
    },
    EMPLOYEE_PROFILE_NOT_FOUND: {
      status: 404,
      message: "Employee profile not found for this account",
    },
    EMPLOYEE_NOT_FOUND: {
      status: 404,
      message: "Employee not found or is inactive",
    },
    ATTENDANCE_NOT_FOUND: {
      status: 404,
      message: "Attendance record not found",
    },
    INVALID_ATTENDANCE_ID: {
      status: 400,
      message: "Invalid attendance record ID",
    },
    INVALID_ATTENDANCE_TIMESTAMPS: {
      status: 400,
      message: "Check-out time must be after check-in time",
    },
    INVALID_EMPLOYEE_ID: {
      status: 400,
      message: "Invalid employee ID",
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

const getEmployeeIdFromUser = async (userId?: string): Promise<string> => {
  if (!userId) throw new Error("UNAUTHORIZED");
  const employee = await ensureEmployeeForUser(userId);
  return employee._id.toString();
};

export const handleCheckIn = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = await getEmployeeIdFromUser(req.user?.userId);
    const record = await checkIn(employeeId);

    return res.status(201).json({
      success: true,
      message: "Check-in successful",
      data: record,
    });
  } catch (error) {
    handleAttendanceError(error, res, next);
  }
};

export const handleCheckOut = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = await getEmployeeIdFromUser(req.user?.userId);
    const record = await checkOut(employeeId);

    return res.status(200).json({
      success: true,
      message: "Check-out successful",
      data: record,
    });
  } catch (error) {
    handleAttendanceError(error, res, next);
  }
};

export const handleGetToday = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = await getEmployeeIdFromUser(req.user?.userId);
    const record = await getTodayAttendance(employeeId);

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    handleAttendanceError(error, res, next);
  }
};

export const handleGetMyHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = await getEmployeeIdFromUser(req.user?.userId);
    const parsed = attendanceHistoryQuerySchema.parse(req.query);
    const result = await getEmployeeAttendance(employeeId, parsed);

    return res.status(200).json({
      success: true,
      data: result.records,
      meta: result.pagination,
    });
  } catch (error) {
    handleAttendanceError(error, res, next);
  }
};

export const handleGetAllAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = attendanceQuerySchema.parse(req.query);
    const result = await getAllAttendance(parsed);

    return res.status(200).json({
      success: true,
      data: result.records,
      summary: result.summary,
      meta: result.pagination,
    });
  } catch (error) {
    handleAttendanceError(error, res, next);
  }
};

export const handleGetAttendanceById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const record = await getAttendanceById(String(req.params.id));

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    handleAttendanceError(error, res, next);
  }
};

export const handleUpdateAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = updateAttendanceSchema.parse(req.body);
    const record = await updateAttendance(
      String(req.params.id),
      parsed
    );

    return res.status(200).json({
      success: true,
      message: "Attendance record updated successfully",
      data: record,
    });
  } catch (error) {
    handleAttendanceError(error, res, next);
  }
};
