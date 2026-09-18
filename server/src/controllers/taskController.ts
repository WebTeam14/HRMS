import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { WorkTask } from "../models/WorkTask";
import { Employee } from "../models/Employee";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";

// ─── Helper: auto-mark overdue tasks ───────────────────────────────────────
const markOverdueTasks = async () => {
  const now = new Date();
  await WorkTask.updateMany(
    {
      status: { $in: ["TODO", "IN_PROGRESS"] },
      dueDate: { $lt: now },
    },
    { $set: { status: "OVERDUE" } }
  );
};

// ─── Create Task (Manager assigns to employee) ─────────────────────────────
export const createTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const assigner = await ensureEmployeeForUser(userId);
    const { title, description, assigneeId, priority, dueDate, estimatedHours } = req.body;

    if (!title || !assigneeId) {
      res.status(400).json({ success: false, message: "Title and assignee are required" });
      return;
    }

    // verify assignee exists
    const assignee = await Employee.findById(assigneeId);
    if (!assignee) {
      res.status(404).json({ success: false, message: "Assignee employee not found" });
      return;
    }

    const task = await WorkTask.create({
      title,
      description,
      employeeId: assigneeId,
      assignedById: assigner._id,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours: estimatedHours || 0,
      status: "TODO",
    });

    const populated = await WorkTask.findById(task._id)
      .populate("employeeId", "firstName lastName employeeCode designation departmentId")
      .populate("assignedById", "firstName lastName designation");

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      data: populated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to create task" });
  }
};

// ─── Get My Tasks (Employee sees tasks assigned to them) ───────────────────
export const getMyTasks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    await markOverdueTasks();

    const employee = await ensureEmployeeForUser(userId);
    const { status, priority } = req.query as any;

    const filter: any = { employeeId: employee._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await WorkTask.find(filter)
      .populate("assignedById", "firstName lastName designation")
      .sort({ dueDate: 1, createdAt: -1 });

    // stats
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const overdue = tasks.filter((t) => t.status === "OVERDUE").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todo = tasks.filter((t) => t.status === "TODO").length;

    res.status(200).json({
      success: true,
      data: tasks,
      stats: { total, completed, overdue, inProgress, todo },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch tasks" });
  }
};

// ─── Get Team Tasks (Manager sees all tasks they assigned) ─────────────────
export const getTeamTasks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    await markOverdueTasks();

    const manager = await ensureEmployeeForUser(userId);
    const { status, priority, assigneeId } = req.query as any;

    // Build filter: tasks assigned by this manager, or if CEO/HR/Admin, all tasks
    const role = req.user?.role;
    const isTopLevel = role === "CEO" || role === "ADMIN" || role === "HR";

    const filter: any = {};
    if (!isTopLevel) {
      filter.assignedById = manager._id;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.employeeId = assigneeId;

    const tasks = await WorkTask.find(filter)
      .populate("employeeId", "firstName lastName employeeCode designation departmentId")
      .populate("assignedById", "firstName lastName designation")
      .sort({ dueDate: 1, createdAt: -1 });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const overdue = tasks.filter((t) => t.status === "OVERDUE").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todo = tasks.filter((t) => t.status === "TODO").length;

    res.status(200).json({
      success: true,
      data: tasks,
      stats: { total, completed, overdue, inProgress, todo },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch team tasks" });
  }
};

// ─── Update Task Status ────────────────────────────────────────────────────
export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, actualHours } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: "Status is required" });
      return;
    }

    const update: any = { status };
    if (actualHours !== undefined) update.actualHours = actualHours;
    if (status === "COMPLETED") update.completedAt = new Date();

    const task = await WorkTask.findByIdAndUpdate(taskId, { $set: update }, { new: true })
      .populate("employeeId", "firstName lastName employeeCode designation")
      .populate("assignedById", "firstName lastName designation");

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Task status updated",
      data: task,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update task" });
  }
};

// ─── Update Task (full edit) ───────────────────────────────────────────────
export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, description, priority, dueDate, estimatedHours, assigneeId } = req.body;

    const update: any = {};
    if (title) update.title = title;
    if (description !== undefined) update.description = description;
    if (priority) update.priority = priority;
    if (dueDate) update.dueDate = new Date(dueDate);
    if (estimatedHours !== undefined) update.estimatedHours = estimatedHours;
    if (assigneeId) update.employeeId = assigneeId;

    const task = await WorkTask.findByIdAndUpdate(taskId, { $set: update }, { new: true })
      .populate("employeeId", "firstName lastName employeeCode designation")
      .populate("assignedById", "firstName lastName designation");

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Task updated", data: task });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update task" });
  }
};

// ─── Delete Task ───────────────────────────────────────────────────────────
export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const task = await WorkTask.findByIdAndDelete(taskId);

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to delete task" });
  }
};

// ─── Get Alert Counts (for Dashboard) ─────────────────────────────────────
export const getTaskAlerts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    await markOverdueTasks();

    const employee = await ensureEmployeeForUser(userId);
    const role = req.user?.role;
    const isManager = role === "CEO" || role === "ADMIN" || role === "HR" || role === "MANAGER";

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let myFilter: any = { employeeId: employee._id };
    let teamFilter: any = isManager
      ? (role === "CEO" || role === "ADMIN" || role === "HR"
          ? {}
          : { assignedById: employee._id })
      : null;

    const myOverdue = await WorkTask.countDocuments({ ...myFilter, status: "OVERDUE" });
    const myPending = await WorkTask.countDocuments({ ...myFilter, status: { $in: ["TODO", "IN_PROGRESS"] } });
    const myDueToday = await WorkTask.countDocuments({
      ...myFilter,
      status: { $in: ["TODO", "IN_PROGRESS"] },
      dueDate: { $gte: todayStart, $lte: today },
    });

    let teamOverdue = 0;
    let teamPending = 0;
    if (teamFilter) {
      teamOverdue = await WorkTask.countDocuments({ ...teamFilter, status: "OVERDUE" });
      teamPending = await WorkTask.countDocuments({ ...teamFilter, status: { $in: ["TODO", "IN_PROGRESS"] } });
    }

    res.status(200).json({
      success: true,
      data: {
        myOverdue,
        myPending,
        myDueToday,
        teamOverdue,
        teamPending,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch alerts" });
  }
};

// ─── Get Team Members (for assignee dropdown) ─────────────────────────────
export const getTeamMembers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employees = await Employee.find({ status: "ACTIVE" })
      .populate("departmentId", "name")
      .select("firstName lastName employeeCode designation departmentId")
      .sort("firstName");

    res.status(200).json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch team members" });
  }
};
