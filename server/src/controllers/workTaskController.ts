import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { Employee } from "../models/Employee";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";
import * as workTaskService from "../services/workTaskService";

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

    const employee = await ensureEmployeeForUser(userId);

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const task = await workTaskService.createTask(id, employee._id, req.body);

    res.status(201).json({
      success: true,
      message: "Task added successfully",
      data: task,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add task",
    });
  }
};

export const updateTask = async (
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

    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const task = await workTaskService.updateTask(taskId, employee._id, req.body);

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update task",
    });
  }
};

export const deleteTask = async (
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

    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    await workTaskService.deleteTask(taskId, employee._id);

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete task",
    });
  }
};

export const getTasks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const tasks = await workTaskService.getTasksByWorkUpdate(id);

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve tasks",
    });
  }
};
