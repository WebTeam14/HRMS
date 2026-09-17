import mongoose from "mongoose";
import { LeaveRequest, ILeaveRequest, LeaveRequestStatus } from "../models/LeaveRequest";
import { LeaveType } from "../models/LeaveType";
import { Employee, IEmployee } from "../models/Employee";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";
import { Attendance } from "../models/Attendance";
import { getNormalizedDate } from "../config/attendanceConfig";
import {
  adjustBalanceForApply,
  adjustBalanceForApproval,
  adjustBalanceForRejection,
  adjustBalanceForCancellation,
} from "./leaveBalanceService";

/**
 * Normalizes a Date to UTC start of day for clean calendar comparisons.
 */
const toNormalizedDay = (dateInput: string | Date): Date => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Calculates calendar days between two normalized dates inclusive.
 */
export const calculateLeaveDays = (startDate: Date, endDate: Date): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
};

export const applyLeave = async (
  userId: string,
  input: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }
): Promise<ILeaveRequest> => {
  // 1. Verify active employee
  const employee = await ensureEmployeeForUser(userId);
  if (employee.status !== "ACTIVE") {
    throw new Error("Only active employees can apply for leave");
  }

  // 2. Verify active leave type
  const leaveType = await LeaveType.findById(input.leaveTypeId);
  if (!leaveType || !leaveType.isActive) {
    throw new Error("Selected leave type is not active or does not exist");
  }

  // 3. Normalize dates & calculate calendar days
  const startDate = toNormalizedDay(input.startDate);
  const endDate = toNormalizedDay(input.endDate);

  if (endDate < startDate) {
    throw new Error("End date cannot be earlier than start date");
  }

  const totalDays = calculateLeaveDays(startDate, endDate);
  const leaveYear = startDate.getUTCFullYear();

  // 4. Overlap check: Prevent overlapping pending or approved requests
  const overlap = await LeaveRequest.findOne({
    employeeId: employee._id,
    status: { $in: ["PENDING", "APPROVED"] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });

  if (overlap) {
    throw new Error(
      "You already have a pending or approved leave request that overlaps with this date range"
    );
  }

  // 5. Check and deduct pending balance safely
  await adjustBalanceForApply(employee._id, leaveType._id, leaveYear, totalDays);

  // 6. Create leave request
  const leaveRequest = new LeaveRequest({
    employeeId: employee._id,
    leaveTypeId: leaveType._id,
    startDate,
    endDate,
    totalDays,
    reason: input.reason.trim(),
    status: "PENDING",
  });

  await leaveRequest.save();

  return (await leaveRequest.populate([
    { path: "leaveTypeId" },
    { path: "employeeId", select: "employeeCode firstName lastName designation" },
  ])) as ILeaveRequest;
};

export const getMyLeaveRequests = async (
  userId: string,
  query: {
    status?: LeaveRequestStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ requests: ILeaveRequest[]; total: number; page: number; limit: number; totalPages: number }> => {
  const employee = await ensureEmployeeForUser(userId);

  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const filter: any = { employeeId: employee._id };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.startDate && query.endDate) {
    filter.startDate = { $gte: toNormalizedDay(query.startDate) };
    filter.endDate = { $lte: toNormalizedDay(query.endDate) };
  }

  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("leaveTypeId")
      .populate("reviewedBy", "email role"),
    LeaveRequest.countDocuments(filter),
  ]);

  return {
    requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getLeaveRequestById = async (
  id: string,
  userId: string,
  userRole: string
): Promise<ILeaveRequest | null> => {
  const request = await LeaveRequest.findById(id)
    .populate({
      path: "employeeId",
      populate: [
        { path: "departmentId", select: "name code" },
        { path: "userId", select: "email role isActive" },
      ],
    })
    .populate("leaveTypeId")
    .populate("reviewedBy", "email role");

  if (!request) {
    return null;
  }

  // If non-management, ensure the employee owns this record
  const isManagement = ["HR", "ADMIN", "CEO", "MANAGER"].includes(userRole);
  if (!isManagement) {
    const emp = request.employeeId as unknown as IEmployee;
    const empUserId = (emp as any)?.userId?._id?.toString() || (emp as any)?.userId?.toString();
    if (empUserId !== userId) {
      throw new Error("You do not have permission to view this leave request");
    }
  }

  return request;
};

export const cancelLeaveRequest = async (
  id: string,
  userId: string,
  userRole: string
): Promise<ILeaveRequest> => {
  const request = await LeaveRequest.findById(id);
  if (!request) {
    throw new Error("Leave request not found");
  }

  const employee = await Employee.findOne({ userId });
  const isManagement = ["HR", "ADMIN", "CEO"].includes(userRole);

  if (!isManagement) {
    if (!employee || request.employeeId.toString() !== employee._id.toString()) {
      throw new Error("You can only cancel your own leave requests");
    }
    if (request.status !== "PENDING") {
      throw new Error("Employees can only cancel PENDING leave requests");
    }
  } else {
    if (!["PENDING", "APPROVED"].includes(request.status)) {
      throw new Error("Only PENDING or APPROVED requests can be cancelled");
    }
  }

  const previousStatus = request.status as "PENDING" | "APPROVED";
  request.status = "CANCELLED";
  await request.save();

  // Restore balance
  const leaveYear = request.startDate.getUTCFullYear();
  await adjustBalanceForCancellation(
    request.employeeId,
    request.leaveTypeId,
    leaveYear,
    request.totalDays,
    previousStatus
  );

  // If was previously APPROVED, revert attendance records on those dates
  if (previousStatus === "APPROVED") {
    let current = new Date(request.startDate);
    const end = new Date(request.endDate);

    while (current <= end) {
      const normalized = toNormalizedDay(current);
      const existingAttendance = await Attendance.findOne({
        employeeId: request.employeeId,
        date: normalized,
      });

      if (existingAttendance && existingAttendance.status === "ON_LEAVE") {
        if (existingAttendance.checkIn) {
          existingAttendance.status = "PRESENT";
          await existingAttendance.save();
        } else {
          // Remove or reset to absent
          await Attendance.deleteOne({ _id: existingAttendance._id });
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  return (await request.populate([
    { path: "leaveTypeId" },
    { path: "employeeId", select: "employeeCode firstName lastName" },
  ])) as ILeaveRequest;
};

export const getAllLeaveRequests = async (query: {
  status?: LeaveRequestStatus;
  employeeId?: string;
  departmentId?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  requests: ILeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    pending: number;
    approved: number;
    rejected: number;
    onLeaveToday: number;
  };
}> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (query.status) {
    filter.status = query.status;
  }
  if (query.leaveTypeId) {
    filter.leaveTypeId = query.leaveTypeId;
  }

  if (query.employeeId) {
    filter.employeeId = query.employeeId;
  } else if (query.departmentId) {
    const deptEmployees = await Employee.find({ departmentId: query.departmentId }).select("_id");
    filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
  }

  if (query.startDate && query.endDate) {
    filter.startDate = { $gte: toNormalizedDay(query.startDate) };
    filter.endDate = { $lte: toNormalizedDay(query.endDate) };
  }

  const sortField = query.sortBy || "createdAt";
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const today = getNormalizedDate();

  const [requests, total, pendingCount, approvedCount, rejectedCount, onLeaveTodayCount] =
    await Promise.all([
      LeaveRequest.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "employeeId",
          select: "employeeCode firstName lastName designation departmentId",
          populate: { path: "departmentId", select: "name code" },
        })
        .populate("leaveTypeId")
        .populate("reviewedBy", "email role"),
      LeaveRequest.countDocuments(filter),
      LeaveRequest.countDocuments({ status: "PENDING" }),
      LeaveRequest.countDocuments({ status: "APPROVED" }),
      LeaveRequest.countDocuments({ status: "REJECTED" }),
      LeaveRequest.countDocuments({
        status: "APPROVED",
        startDate: { $lte: today },
        endDate: { $gte: today },
      }),
    ]);

  return {
    requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    summary: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      onLeaveToday: onLeaveTodayCount,
    },
  };
};

export const approveLeaveRequest = async (
  id: string,
  reviewerUserId: string
): Promise<ILeaveRequest> => {
  const request = await LeaveRequest.findById(id).populate("employeeId");
  if (!request) {
    throw new Error("Leave request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Cannot approve a leave request with status '${request.status}'`);
  }

  // Prevent employee from approving their own request
  const emp = request.employeeId as unknown as IEmployee;
  if (emp && emp.userId && emp.userId.toString() === reviewerUserId) {
    throw new Error("You cannot approve your own leave request");
  }

  // 1. Update LeaveRequest
  request.status = "APPROVED";
  request.reviewedBy = new mongoose.Types.ObjectId(reviewerUserId);
  request.reviewedAt = new Date();
  await request.save();

  // 2. Update Leave Balance
  const leaveYear = request.startDate.getUTCFullYear();
  await adjustBalanceForApproval(
    request.employeeId._id,
    request.leaveTypeId,
    leaveYear,
    request.totalDays
  );

  // 3. Update/Create Attendance records to ON_LEAVE for all dates
  const leaveType = await LeaveType.findById(request.leaveTypeId);
  const leaveTypeName = leaveType ? leaveType.name : "Approved Leave";

  let current = new Date(request.startDate);
  const end = new Date(request.endDate);

  while (current <= end) {
    const normalized = toNormalizedDay(current);

    const existingAttendance = await Attendance.findOne({
      employeeId: request.employeeId._id,
      date: normalized,
    });

    if (existingAttendance) {
      existingAttendance.status = "ON_LEAVE";
      existingAttendance.notes = existingAttendance.notes
        ? `${existingAttendance.notes} | ${leaveTypeName}`
        : `Approved Leave: ${leaveTypeName}`;
      await existingAttendance.save();
    } else {
      await Attendance.create({
        employeeId: request.employeeId._id,
        date: normalized,
        status: "ON_LEAVE",
        checkInSource: "SYSTEM",
        notes: `Approved Leave: ${leaveTypeName}`,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return (await request.populate([
    { path: "leaveTypeId" },
    {
      path: "employeeId",
      select: "employeeCode firstName lastName designation departmentId",
      populate: { path: "departmentId", select: "name code" },
    },
    { path: "reviewedBy", select: "email role" },
  ])) as ILeaveRequest;
};

export const rejectLeaveRequest = async (
  id: string,
  reviewerUserId: string,
  rejectionReason: string
): Promise<ILeaveRequest> => {
  const request = await LeaveRequest.findById(id).populate("employeeId");
  if (!request) {
    throw new Error("Leave request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Cannot reject a leave request with status '${request.status}'`);
  }

  // Prevent employee from reviewing own request
  const emp = request.employeeId as unknown as IEmployee;
  if (emp && emp.userId && emp.userId.toString() === reviewerUserId) {
    throw new Error("You cannot review your own leave request");
  }

  request.status = "REJECTED";
  request.reviewedBy = new mongoose.Types.ObjectId(reviewerUserId);
  request.reviewedAt = new Date();
  request.rejectionReason = rejectionReason.trim();
  await request.save();

  // Restore balance
  const leaveYear = request.startDate.getUTCFullYear();
  await adjustBalanceForRejection(
    request.employeeId._id,
    request.leaveTypeId,
    leaveYear,
    request.totalDays
  );

  return (await request.populate([
    { path: "leaveTypeId" },
    {
      path: "employeeId",
      select: "employeeCode firstName lastName designation departmentId",
      populate: { path: "departmentId", select: "name code" },
    },
    { path: "reviewedBy", select: "email role" },
  ])) as ILeaveRequest;
};
