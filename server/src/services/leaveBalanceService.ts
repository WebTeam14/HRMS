import mongoose from "mongoose";
import { LeaveBalance, ILeaveBalance } from "../models/LeaveBalance";
import { getLeaveTypes } from "./leaveTypeService";

export const initializeEmployeeLeaveBalances = async (
  employeeId: string | mongoose.Types.ObjectId,
  year: number = new Date().getFullYear()
): Promise<ILeaveBalance[]> => {
  const activeLeaveTypes = await getLeaveTypes(true);
  const balances: ILeaveBalance[] = [];

  for (const leaveType of activeLeaveTypes) {
    const existing = await LeaveBalance.findOne({
      employeeId,
      leaveTypeId: leaveType._id,
      year,
    });

    if (!existing) {
      const allocated = leaveType.defaultDays || 0;
      const newBalance = new LeaveBalance({
        employeeId,
        leaveTypeId: leaveType._id,
        year,
        allocatedDays: allocated,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: allocated,
      });
      await newBalance.save();
      balances.push(newBalance);
    } else {
      balances.push(existing);
    }
  }

  return balances;
};

export const getEmployeeLeaveBalances = async (
  employeeId: string | mongoose.Types.ObjectId,
  year: number = new Date().getFullYear()
): Promise<ILeaveBalance[]> => {
  // Ensure initialization for current active leave types
  await initializeEmployeeLeaveBalances(employeeId, year);

  return LeaveBalance.find({ employeeId, year })
    .populate("leaveTypeId")
    .sort({ "leaveTypeId.name": 1 });
};

export const getLeaveBalanceRecord = async (
  employeeId: string | mongoose.Types.ObjectId,
  leaveTypeId: string | mongoose.Types.ObjectId,
  year: number
): Promise<ILeaveBalance> => {
  let balance = await LeaveBalance.findOne({ employeeId, leaveTypeId, year });
  if (!balance) {
    await initializeEmployeeLeaveBalances(employeeId, year);
    balance = await LeaveBalance.findOne({ employeeId, leaveTypeId, year });
  }

  if (!balance) {
    throw new Error("Leave balance record not found for this leave type and year");
  }

  return balance;
};

export const adjustBalanceForApply = async (
  employeeId: string | mongoose.Types.ObjectId,
  leaveTypeId: string | mongoose.Types.ObjectId,
  year: number,
  days: number
): Promise<ILeaveBalance> => {
  const balance = await getLeaveBalanceRecord(employeeId, leaveTypeId, year);

  const available = balance.allocatedDays - balance.usedDays - balance.pendingDays;
  if (available < days) {
    throw new Error(
      `Insufficient leave balance. Available: ${available} day(s), Requested: ${days} day(s)`
    );
  }

  balance.pendingDays += days;
  balance.remainingDays = Math.max(
    0,
    balance.allocatedDays - balance.usedDays - balance.pendingDays
  );

  return balance.save();
};

export const adjustBalanceForApproval = async (
  employeeId: string | mongoose.Types.ObjectId,
  leaveTypeId: string | mongoose.Types.ObjectId,
  year: number,
  days: number
): Promise<ILeaveBalance> => {
  const balance = await getLeaveBalanceRecord(employeeId, leaveTypeId, year);

  balance.pendingDays = Math.max(0, balance.pendingDays - days);
  balance.usedDays += days;
  balance.remainingDays = Math.max(
    0,
    balance.allocatedDays - balance.usedDays - balance.pendingDays
  );

  return balance.save();
};

export const adjustBalanceForRejection = async (
  employeeId: string | mongoose.Types.ObjectId,
  leaveTypeId: string | mongoose.Types.ObjectId,
  year: number,
  days: number
): Promise<ILeaveBalance> => {
  const balance = await getLeaveBalanceRecord(employeeId, leaveTypeId, year);

  balance.pendingDays = Math.max(0, balance.pendingDays - days);
  balance.remainingDays = Math.max(
    0,
    balance.allocatedDays - balance.usedDays - balance.pendingDays
  );

  return balance.save();
};

export const adjustBalanceForCancellation = async (
  employeeId: string | mongoose.Types.ObjectId,
  leaveTypeId: string | mongoose.Types.ObjectId,
  year: number,
  days: number,
  previousStatus: "PENDING" | "APPROVED"
): Promise<ILeaveBalance> => {
  const balance = await getLeaveBalanceRecord(employeeId, leaveTypeId, year);

  if (previousStatus === "PENDING") {
    balance.pendingDays = Math.max(0, balance.pendingDays - days);
  } else if (previousStatus === "APPROVED") {
    balance.usedDays = Math.max(0, balance.usedDays - days);
  }

  balance.remainingDays = Math.max(
    0,
    balance.allocatedDays - balance.usedDays - balance.pendingDays
  );

  return balance.save();
};
