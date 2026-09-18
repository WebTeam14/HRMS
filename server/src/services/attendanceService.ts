import mongoose from "mongoose";
import { Attendance, AttendanceStatus, IAttendance } from "../models/Attendance";
import { Employee } from "../models/Employee";
import {
  getNormalizedDate,
  determineCheckInStatus,
  determineCheckOutStatus,
} from "../config/attendanceConfig";

export interface AttendanceQuery {
  date?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  departmentId?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AttendanceHistoryQuery {
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface UpdateAttendanceInput {
  checkIn?: Date;
  checkOut?: Date | null;
  status?: AttendanceStatus;
  notes?: string;
}

export const checkIn = async (employeeId: string) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const employee = await Employee.findOne({
    _id: employeeId,
    status: { $ne: "INACTIVE" },
  });

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  const todayDate = getNormalizedDate();
  const existingRecord = await Attendance.findOne({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    date: todayDate,
  });

  if (existingRecord) {
    throw new Error("ALREADY_CHECKED_IN");
  }

  const now = new Date();
  const status = determineCheckInStatus(now);

  const attendance = await Attendance.create({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    date: todayDate,
    checkIn: now,
    status,
    checkInSource: "WEB",
    totalWorkingMinutes: 0,
  });

  return getAttendanceById(attendance._id.toString());
};

export const checkOut = async (employeeId: string) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const employee = await Employee.findOne({
    _id: employeeId,
    status: { $ne: "INACTIVE" },
  });

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  const todayDate = getNormalizedDate();
  const attendance = await Attendance.findOne({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    date: todayDate,
  });

  if (!attendance || !attendance.checkIn) {
    throw new Error("NOT_CHECKED_IN");
  }

  if (attendance.checkOut) {
    throw new Error("ALREADY_CHECKED_OUT");
  }

  const now = new Date();
  const diffMs = now.getTime() - attendance.checkIn.getTime();
  const workingMinutes = Math.max(0, Math.round(diffMs / 60000));

  const checkOutResult = determineCheckOutStatus(
    attendance.checkIn,
    now,
    attendance.status as "PRESENT" | "LATE" | "HALF_DAY"
  );

  attendance.checkOut = now;
  attendance.totalWorkingMinutes = workingMinutes;
  attendance.status = checkOutResult.status;
  if (checkOutResult.note) {
    attendance.notes = attendance.notes
      ? `${attendance.notes} | ${checkOutResult.note}`
      : checkOutResult.note;
  }

  await attendance.save();

  return getAttendanceById(attendance._id.toString());
};

export const getTodayAttendance = async (employeeId: string) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const todayDate = getNormalizedDate();
  const attendance = await Attendance.findOne({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    date: todayDate,
  }).populate({
    path: "employeeId",
    select: "employeeCode firstName lastName designation departmentId",
    populate: { path: "departmentId", select: "name code" },
  });

  return attendance;
};

export const getEmployeeAttendance = async (
  employeeId: string,
  query: AttendanceHistoryQuery = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const { startDate, endDate, status, page = 1, limit = 10 } = query;
  const filter: any = {
    employeeId: new mongoose.Types.ObjectId(employeeId),
  };

  if (status) {
    filter.status = status;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = getNormalizedDate(new Date(startDate));
    }
    if (endDate) {
      filter.date.$lte = getNormalizedDate(new Date(endDate));
    }
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter),
  ]);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAllAttendance = async (query: AttendanceQuery = {}) => {
  const {
    date,
    startDate,
    endDate,
    employeeId,
    departmentId,
    status,
    page = 1,
    limit = 10,
    sortBy = "date",
    sortOrder = "desc",
  } = query;

  const filter: any = {};

  if (status) {
    filter.status = status;
  }

  if (employeeId && employeeId !== "" && mongoose.Types.ObjectId.isValid(employeeId)) {
    filter.employeeId = new mongoose.Types.ObjectId(employeeId);
  } else if (
    departmentId &&
    departmentId !== "" &&
    mongoose.Types.ObjectId.isValid(departmentId)
  ) {
    const deptEmployees = await Employee.find({
      departmentId: new mongoose.Types.ObjectId(departmentId),
    }).select("_id");
    filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
  }

  if (date) {
    filter.date = getNormalizedDate(new Date(date));
  } else if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = getNormalizedDate(new Date(startDate));
    }
    if (endDate) {
      filter.date.$lte = getNormalizedDate(new Date(endDate));
    }
  }

  const allowedSortFields = ["date", "createdAt", "status"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date";
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  // Build summary metrics for the targeted date or today
  const targetSummaryDate = date
    ? getNormalizedDate(new Date(date))
    : getNormalizedDate();

  const [records, total, presentCount, lateCount, onLeaveCount, halfDayCount, totalActiveEmployees] =
    await Promise.all([
      Attendance.find(filter)
        .populate({
          path: "employeeId",
          select: "employeeCode firstName lastName designation departmentId",
          populate: { path: "departmentId", select: "name code" },
        })
        .sort({ [safeSortBy]: sortDirection, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
      Attendance.countDocuments({ date: targetSummaryDate, status: "PRESENT" }),
      Attendance.countDocuments({ date: targetSummaryDate, status: "LATE" }),
      Attendance.countDocuments({ date: targetSummaryDate, status: "ON_LEAVE" }),
      Attendance.countDocuments({ date: targetSummaryDate, status: "HALF_DAY" }),
      Employee.countDocuments({ status: "ACTIVE" }),
    ]);

  const markedAttendanceCount = presentCount + lateCount + onLeaveCount + halfDayCount;
  const absentCount = Math.max(0, totalActiveEmployees - markedAttendanceCount);

  return {
    records,
    summary: {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      onLeave: onLeaveCount,
      halfDay: halfDayCount,
      totalActive: totalActiveEmployees,
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAttendanceById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_ATTENDANCE_ID");
  }

  const attendance = await Attendance.findById(id).populate({
    path: "employeeId",
    select: "employeeCode firstName lastName designation departmentId phone",
    populate: { path: "departmentId", select: "name code" },
  });

  if (!attendance) {
    throw new Error("ATTENDANCE_NOT_FOUND");
  }

  return attendance;
};

export const updateAttendance = async (
  id: string,
  input: UpdateAttendanceInput
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_ATTENDANCE_ID");
  }

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    throw new Error("ATTENDANCE_NOT_FOUND");
  }

  const targetCheckIn =
    input.checkIn !== undefined ? input.checkIn : attendance.checkIn;
  const targetCheckOut =
    input.checkOut !== undefined ? input.checkOut : attendance.checkOut;

  if (targetCheckIn && targetCheckOut) {
    if (new Date(targetCheckOut).getTime() <= new Date(targetCheckIn).getTime()) {
      throw new Error("INVALID_ATTENDANCE_TIMESTAMPS");
    }

    const diffMs =
      new Date(targetCheckOut).getTime() - new Date(targetCheckIn).getTime();
    attendance.totalWorkingMinutes = Math.max(0, Math.round(diffMs / 60000));
  }

  if (input.checkIn !== undefined) {
    attendance.checkIn = input.checkIn;
  }

  if (input.checkOut !== undefined) {
    attendance.checkOut = input.checkOut || undefined;
    if (!input.checkOut) {
      attendance.totalWorkingMinutes = 0;
    }
  }

  if (input.status) {
    attendance.status = input.status;
  }

  if (input.notes !== undefined) {
    attendance.notes = input.notes.trim();
  }

  await attendance.save();

  return getAttendanceById(id);
};
