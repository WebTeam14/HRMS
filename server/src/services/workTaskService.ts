import mongoose from "mongoose";
import { WorkTask, IWorkTask, WorkTaskStatus, WorkTaskPriority } from "../models/WorkTask";
import { WorkUpdate } from "../models/WorkUpdate";

export const recalculateWorkUpdateHours = async (
  workUpdateId: string | mongoose.Types.ObjectId
): Promise<number> => {
  const tasks = await WorkTask.find({ workUpdateId });
  const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  await WorkUpdate.findByIdAndUpdate(workUpdateId, {
    totalHours: Number(totalActual.toFixed(2)),
  });
  return totalActual;
};

export const getTasksByWorkUpdate = async (
  workUpdateId: string | mongoose.Types.ObjectId
): Promise<IWorkTask[]> => {
  return WorkTask.find({ workUpdateId }).sort({ createdAt: 1 });
};

export const createTask = async (
  workUpdateId: string,
  employeeId: string | mongoose.Types.ObjectId,
  data: {
    title: string;
    description?: string;
    status?: WorkTaskStatus;
    priority?: WorkTaskPriority;
    estimatedHours?: number;
    actualHours?: number;
  }
): Promise<IWorkTask> => {
  const update = await WorkUpdate.findById(workUpdateId);
  if (!update) {
    throw new Error("Work update not found");
  }

  if (update.employeeId.toString() !== employeeId.toString()) {
    throw new Error("You can only add tasks to your own work update");
  }

  if (!["DRAFT", "CHANGES_REQUESTED"].includes(update.status)) {
    throw new Error("Tasks can only be modified on Draft or Changes Requested work updates");
  }

  const task = new WorkTask({
    workUpdateId: update._id,
    employeeId,
    title: data.title.trim(),
    description: data.description?.trim(),
    status: data.status || "COMPLETED",
    priority: data.priority || "MEDIUM",
    estimatedHours: data.estimatedHours || 0,
    actualHours: data.actualHours || 0,
  });

  await task.save();
  await recalculateWorkUpdateHours(update._id);

  return task;
};

export const updateTask = async (
  taskId: string,
  employeeId: string | mongoose.Types.ObjectId,
  data: {
    title?: string;
    description?: string;
    status?: WorkTaskStatus;
    priority?: WorkTaskPriority;
    estimatedHours?: number;
    actualHours?: number;
  }
): Promise<IWorkTask> => {
  const task = await WorkTask.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const update = await WorkUpdate.findById(task.workUpdateId);
  if (!update) {
    throw new Error("Parent work update not found");
  }

  if (task.employeeId.toString() !== employeeId.toString()) {
    throw new Error("You can only update your own tasks");
  }

  if (!["DRAFT", "CHANGES_REQUESTED"].includes(update.status)) {
    throw new Error("Tasks can only be modified on Draft or Changes Requested work updates");
  }

  if (data.title !== undefined) task.title = data.title.trim();
  if (data.description !== undefined) task.description = data.description.trim();
  if (data.status !== undefined) task.status = data.status;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.estimatedHours !== undefined) task.estimatedHours = data.estimatedHours;
  if (data.actualHours !== undefined) task.actualHours = data.actualHours;

  await task.save();
  await recalculateWorkUpdateHours(update._id);

  return task;
};

export const deleteTask = async (
  taskId: string,
  employeeId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean }> => {
  const task = await WorkTask.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const update = await WorkUpdate.findById(task.workUpdateId);
  if (!update) {
    throw new Error("Parent work update not found");
  }

  if (task.employeeId.toString() !== employeeId.toString()) {
    throw new Error("You can only delete your own tasks");
  }

  if (!["DRAFT", "CHANGES_REQUESTED"].includes(update.status)) {
    throw new Error("Tasks can only be deleted from Draft or Changes Requested work updates");
  }

  await WorkTask.deleteOne({ _id: taskId });
  await recalculateWorkUpdateHours(update._id);

  return { success: true };
};
