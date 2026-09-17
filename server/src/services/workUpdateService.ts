import mongoose from "mongoose";
import { WorkUpdate, IWorkUpdate, WorkUpdateStatus } from "../models/WorkUpdate";
import { WorkTask, IWorkTask } from "../models/WorkTask";
import { Employee } from "../models/Employee";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";
import { Attendance } from "../models/Attendance";
import { LeaveRequest } from "../models/LeaveRequest";
import { getNormalizedDate } from "../config/attendanceConfig";
import { recalculateWorkUpdateHours } from "./workTaskService";

/**
 * Normalizes input date to IST midnight boundary.
 */
const toNormalizedDay = (dateInput: string | Date): Date => {
  const d = new Date(dateInput);
  return getNormalizedDate(d);
};

export const createWorkUpdate = async (
  userId: string,
  input: {
    date: string;
    summary: string;
    accomplishments?: string;
    blockers?: string;
    nextDayPlan?: string;
    totalHours?: number;
    status?: WorkUpdateStatus;
    tasks?: Array<{
      title: string;
      description?: string;
      status?: "COMPLETED" | "IN_PROGRESS" | "PENDING";
      priority?: "LOW" | "MEDIUM" | "HIGH";
      estimatedHours?: number;
      actualHours?: number;
    }>;
  }
): Promise<any> => {
  const employee = await ensureEmployeeForUser(userId);

  const normalizedDate = toNormalizedDay(input.date);
  const today = getNormalizedDate();

  // Prevent future dates
  if (normalizedDate > today) {
    throw new Error("Cannot create a work update for a future date");
  }

  // Prevent duplicate updates on the same date for the same employee
  const existing = await WorkUpdate.findOne({
    employeeId: employee._id,
    date: normalizedDate,
  });
  if (existing) {
    throw new Error("You already have a daily work update recorded for this date");
  }

  // Check if employee had full-day approved leave on this date
  const onLeave = await LeaveRequest.findOne({
    employeeId: employee._id,
    status: "APPROVED",
    startDate: { $lte: normalizedDate },
    endDate: { $gte: normalizedDate },
  });

  const status = input.status || "DRAFT";

  if (status === "SUBMITTED" && (!input.tasks || input.tasks.length === 0)) {
    throw new Error("At least one task is required before submitting your work update");
  }

  const workUpdate = new WorkUpdate({
    employeeId: employee._id,
    date: normalizedDate,
    summary: input.summary.trim(),
    accomplishments: input.accomplishments?.trim(),
    blockers: input.blockers?.trim(),
    nextDayPlan: input.nextDayPlan?.trim(),
    totalHours: input.totalHours || 0,
    status,
  });

  if (onLeave && !input.blockers) {
    workUpdate.blockers = "Note: Employee had approved leave recorded on this date";
  }

  await workUpdate.save();

  // Create initial tasks if provided
  let createdTasks: IWorkTask[] = [];
  if (input.tasks && input.tasks.length > 0) {
    const tasksToInsert = input.tasks.map((t) => ({
      workUpdateId: workUpdate._id,
      employeeId: employee._id,
      title: t.title.trim(),
      description: t.description?.trim(),
      status: t.status || "COMPLETED",
      priority: t.priority || "MEDIUM",
      estimatedHours: t.estimatedHours || 0,
      actualHours: t.actualHours || 0,
    }));

    createdTasks = (await WorkTask.insertMany(tasksToInsert)) as IWorkTask[];
    await recalculateWorkUpdateHours(workUpdate._id);
  }

  const populated = (await WorkUpdate.findById(workUpdate._id).populate(
    "employeeId",
    "employeeCode firstName lastName designation"
  )) as IWorkUpdate;

  return {
    ...populated.toObject(),
    tasks: createdTasks,
  };
};

export const getMyWorkUpdates = async (
  userId: string,
  query: {
    month?: string;
    status?: WorkUpdateStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  updates: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  monthlyStats: {
    totalUpdates: number;
    totalHours: number;
    tasksCompleted: number;
  };
}> => {
  const employee = await ensureEmployeeForUser(userId);

  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const filter: any = { employeeId: employee._id };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.month) {
    const [yearStr, monthStr] = query.month.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
    filter.date = { $gte: startOfMonth, $lte: endOfMonth };
  } else if (query.startDate && query.endDate) {
    filter.date = {
      $gte: toNormalizedDay(query.startDate),
      $lte: toNormalizedDay(query.endDate),
    };
  }

  const [updates, total] = await Promise.all([
    WorkUpdate.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reviewedBy", "email role"),
    WorkUpdate.countDocuments(filter),
  ]);

  // Aggregate task counts for each update
  const updateIds = updates.map((u) => u._id);
  const tasks = await WorkTask.find({ workUpdateId: { $in: updateIds } });

  const taskMap: Record<string, { total: number; completed: number }> = {};
  tasks.forEach((t) => {
    const uId = t.workUpdateId.toString();
    if (!taskMap[uId]) {
      taskMap[uId] = { total: 0, completed: 0 };
    }
    taskMap[uId].total += 1;
    if (t.status === "COMPLETED") {
      taskMap[uId].completed += 1;
    }
  });

  const enrichedUpdates = updates.map((u) => ({
    ...u.toObject(),
    taskCount: taskMap[u._id.toString()]?.total || 0,
    completedTaskCount: taskMap[u._id.toString()]?.completed || 0,
  }));

  // Monthly stats
  const allMonthlyUpdates = await WorkUpdate.find({
    employeeId: employee._id,
    ...(filter.date ? { date: filter.date } : {}),
  });
  const monthlyHours = allMonthlyUpdates.reduce((sum, u) => sum + (u.totalHours || 0), 0);
  const monthlyTasksCompleted = await WorkTask.countDocuments({
    employeeId: employee._id,
    workUpdateId: { $in: allMonthlyUpdates.map((u) => u._id) },
    status: "COMPLETED",
  });

  return {
    updates: enrichedUpdates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    monthlyStats: {
      totalUpdates: allMonthlyUpdates.filter((u) => u.status !== "DRAFT").length,
      totalHours: Number(monthlyHours.toFixed(1)),
      tasksCompleted: monthlyTasksCompleted,
    },
  };
};

export const getMyWorkUpdateById = async (
  id: string,
  userId: string
): Promise<any> => {
  const employee = await ensureEmployeeForUser(userId);

  const update = await WorkUpdate.findOne({ _id: id, employeeId: employee._id })
    .populate("employeeId", "employeeCode firstName lastName designation")
    .populate("reviewedBy", "email role");

  if (!update) {
    throw new Error("Work update not found");
  }

  const [tasks, attendance] = await Promise.all([
    WorkTask.find({ workUpdateId: update._id }).sort({ createdAt: 1 }),
    Attendance.findOne({ employeeId: employee._id, date: update.date }),
  ]);

  return {
    ...update.toObject(),
    tasks,
    attendance: attendance || null,
  };
};

export const updateWorkUpdate = async (
  id: string,
  userId: string,
  input: {
    summary?: string;
    accomplishments?: string;
    blockers?: string;
    nextDayPlan?: string;
    totalHours?: number;
    date?: string;
  }
): Promise<IWorkUpdate> => {
  const employee = await ensureEmployeeForUser(userId);

  const update = await WorkUpdate.findOne({ _id: id, employeeId: employee._id });
  if (!update) {
    throw new Error("Work update not found");
  }

  if (!["DRAFT", "CHANGES_REQUESTED"].includes(update.status)) {
    throw new Error("Submitted or Approved work updates cannot be edited");
  }

  if (input.summary !== undefined) update.summary = input.summary.trim();
  if (input.accomplishments !== undefined) update.accomplishments = input.accomplishments.trim();
  if (input.blockers !== undefined) update.blockers = input.blockers.trim();
  if (input.nextDayPlan !== undefined) update.nextDayPlan = input.nextDayPlan.trim();
  if (input.totalHours !== undefined) update.totalHours = input.totalHours;

  if (input.date) {
    const normalized = toNormalizedDay(input.date);
    if (normalized > getNormalizedDate()) {
      throw new Error("Cannot set work update date in the future");
    }
    update.date = normalized;
  }

  await update.save();
  return update;
};

export const submitWorkUpdate = async (
  id: string,
  userId: string
): Promise<any> => {
  const employee = await ensureEmployeeForUser(userId);

  const update = await WorkUpdate.findOne({ _id: id, employeeId: employee._id });
  if (!update) {
    throw new Error("Work update not found");
  }

  if (!["DRAFT", "CHANGES_REQUESTED"].includes(update.status)) {
    throw new Error("Only Draft or Changes Requested work updates can be submitted");
  }

  const taskCount = await WorkTask.countDocuments({ workUpdateId: update._id });
  if (taskCount === 0) {
    throw new Error("Please add at least one task before submitting your work update");
  }

  // Recalculate hours
  await recalculateWorkUpdateHours(update._id);

  update.status = "SUBMITTED";
  await update.save();

  const tasks = await WorkTask.find({ workUpdateId: update._id }).sort({ createdAt: 1 });

  return {
    ...update.toObject(),
    tasks,
  };
};

export const deleteDraftWorkUpdate = async (
  id: string,
  userId: string
): Promise<{ success: boolean }> => {
  const employee = await ensureEmployeeForUser(userId);

  const update = await WorkUpdate.findOne({ _id: id, employeeId: employee._id });
  if (!update) {
    throw new Error("Work update not found");
  }

  if (update.status !== "DRAFT") {
    throw new Error("Only DRAFT work updates can be deleted");
  }

  await WorkTask.deleteMany({ workUpdateId: update._id });
  await WorkUpdate.deleteOne({ _id: update._id });

  return { success: true };
};

export const getAllWorkUpdates = async (query: {
  date?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  departmentId?: string;
  status?: WorkUpdateStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  updates: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    pending: number;
    approved: number;
    changesRequested: number;
    totalHours: number;
    tasksCompleted: number;
  };
}> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.employeeId) {
    filter.employeeId = query.employeeId;
  } else if (query.departmentId) {
    const deptEmployees = await Employee.find({ departmentId: query.departmentId }).select("_id");
    filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
  }

  if (query.date) {
    filter.date = toNormalizedDay(query.date);
  } else if (query.month) {
    const [yearStr, monthStr] = query.month.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
    filter.date = { $gte: startOfMonth, $lte: endOfMonth };
  } else if (query.startDate && query.endDate) {
    filter.date = {
      $gte: toNormalizedDay(query.startDate),
      $lte: toNormalizedDay(query.endDate),
    };
  }

  const sortField = query.sortBy || "date";
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const [
    updates,
    total,
    pendingCount,
    approvedCount,
    changesRequestedCount,
    allMatchingUpdates,
  ] = await Promise.all([
    WorkUpdate.find(filter)
      .sort({ [sortField]: sortDirection, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "employeeId",
        select: "employeeCode firstName lastName designation departmentId",
        populate: { path: "departmentId", select: "name code" },
      })
      .populate("reviewedBy", "email role"),
    WorkUpdate.countDocuments(filter),
    WorkUpdate.countDocuments({ status: "SUBMITTED" }),
    WorkUpdate.countDocuments({ status: "APPROVED" }),
    WorkUpdate.countDocuments({ status: "CHANGES_REQUESTED" }),
    WorkUpdate.find(filter).select("_id totalHours"),
  ]);

  const totalHoursSum = allMatchingUpdates.reduce((sum, u) => sum + (u.totalHours || 0), 0);

  // Aggregate task counts
  const updateIds = updates.map((u) => u._id);
  const tasks = await WorkTask.find({ workUpdateId: { $in: updateIds } });

  const taskMap: Record<string, { total: number; completed: number }> = {};
  tasks.forEach((t) => {
    const uId = t.workUpdateId.toString();
    if (!taskMap[uId]) {
      taskMap[uId] = { total: 0, completed: 0 };
    }
    taskMap[uId].total += 1;
    if (t.status === "COMPLETED") {
      taskMap[uId].completed += 1;
    }
  });

  const totalTasksCompleted = await WorkTask.countDocuments({
    workUpdateId: { $in: allMatchingUpdates.map((u) => u._id) },
    status: "COMPLETED",
  });

  const enrichedUpdates = updates.map((u) => ({
    ...u.toObject(),
    taskCount: taskMap[u._id.toString()]?.total || 0,
    completedTaskCount: taskMap[u._id.toString()]?.completed || 0,
  }));

  return {
    updates: enrichedUpdates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    summary: {
      pending: pendingCount,
      approved: approvedCount,
      changesRequested: changesRequestedCount,
      totalHours: Number(totalHoursSum.toFixed(1)),
      tasksCompleted: totalTasksCompleted,
    },
  };
};

export const getWorkUpdateById = async (
  id: string,
  userId: string,
  userRole: string
): Promise<any> => {
  const update = await WorkUpdate.findById(id)
    .populate({
      path: "employeeId",
      populate: [
        { path: "departmentId", select: "name code" },
        { path: "userId", select: "email role isActive" },
      ],
    })
    .populate("reviewedBy", "email role");

  if (!update) {
    throw new Error("Work update not found");
  }

  const isManagement = ["HR", "ADMIN", "CEO", "MANAGER"].includes(userRole);
  if (!isManagement) {
    const emp: any = update.employeeId;
    const empUserId = emp?.userId?._id?.toString() || emp?.userId?.toString();
    if (empUserId !== userId) {
      throw new Error("You do not have permission to view this work update");
    }
  }

  const [tasks, attendance] = await Promise.all([
    WorkTask.find({ workUpdateId: update._id }).sort({ createdAt: 1 }),
    Attendance.findOne({ employeeId: (update.employeeId as any)._id, date: update.date }),
  ]);

  return {
    ...update.toObject(),
    tasks,
    attendance: attendance || null,
  };
};

export const approveWorkUpdate = async (
  id: string,
  reviewerUserId: string
): Promise<IWorkUpdate> => {
  const update = await WorkUpdate.findById(id).populate("employeeId");
  if (!update) {
    throw new Error("Work update not found");
  }

  if (!["SUBMITTED", "CHANGES_REQUESTED"].includes(update.status)) {
    throw new Error(`Cannot approve a work update with status '${update.status}'`);
  }

  const emp: any = update.employeeId;
  if (emp && emp.userId && emp.userId.toString() === reviewerUserId) {
    throw new Error("You cannot approve your own work update");
  }

  update.status = "APPROVED";
  update.reviewedBy = new mongoose.Types.ObjectId(reviewerUserId);
  update.reviewedAt = new Date();
  await update.save();

  return (await update.populate([
    {
      path: "employeeId",
      select: "employeeCode firstName lastName designation departmentId",
      populate: { path: "departmentId", select: "name code" },
    },
    { path: "reviewedBy", select: "email role" },
  ])) as IWorkUpdate;
};

export const requestChangesOnWorkUpdate = async (
  id: string,
  reviewerUserId: string,
  managerComment: string
): Promise<IWorkUpdate> => {
  const update = await WorkUpdate.findById(id).populate("employeeId");
  if (!update) {
    throw new Error("Work update not found");
  }

  if (update.status !== "SUBMITTED") {
    throw new Error(`Can only request changes on submitted work updates`);
  }

  const emp: any = update.employeeId;
  if (emp && emp.userId && emp.userId.toString() === reviewerUserId) {
    throw new Error("You cannot review your own work update");
  }

  update.status = "CHANGES_REQUESTED";
  update.reviewedBy = new mongoose.Types.ObjectId(reviewerUserId);
  update.reviewedAt = new Date();
  update.managerComment = managerComment.trim();
  await update.save();

  return (await update.populate([
    {
      path: "employeeId",
      select: "employeeCode firstName lastName designation departmentId",
      populate: { path: "departmentId", select: "name code" },
    },
    { path: "reviewedBy", select: "email role" },
  ])) as IWorkUpdate;
};
