import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { Employee } from "../models/Employee";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";
import * as leaveBalanceService from "../services/leaveBalanceService";

export const getMyLeaveBalances = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const employee = await ensureEmployeeForUser(userId);

    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
    const balances = await leaveBalanceService.getEmployeeLeaveBalances(employee._id, year);

    res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve leave balances",
    });
  }
};

export const getEmployeeLeaveBalances = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employeeId = Array.isArray(req.params.employeeId)
      ? req.params.employeeId[0]
      : req.params.employeeId;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();

    const balances = await leaveBalanceService.getEmployeeLeaveBalances(employeeId, year);

    res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve employee leave balances",
    });
  }
};
