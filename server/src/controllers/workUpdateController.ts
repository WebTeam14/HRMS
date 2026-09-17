import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import * as workUpdateService from "../services/workUpdateService";

export const createWorkUpdate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const result = await workUpdateService.createWorkUpdate(userId, req.body);

    res.status(201).json({
      success: true,
      message: "Daily work update created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create work update",
    });
  }
};

export const getMyWorkUpdates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const result = await workUpdateService.getMyWorkUpdates(userId, req.query as any);

    res.status(200).json({
      success: true,
      data: result.updates,
      monthlyStats: result.monthlyStats,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve work updates",
    });
  }
};

export const getMyWorkUpdateById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await workUpdateService.getMyWorkUpdateById(id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || "Work update not found",
    });
  }
};

export const updateWorkUpdate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await workUpdateService.updateWorkUpdate(id, userId, req.body);

    res.status(200).json({
      success: true,
      message: "Work update modified successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update work update",
    });
  }
};

export const submitWorkUpdate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await workUpdateService.submitWorkUpdate(id, userId);

    res.status(200).json({
      success: true,
      message: "Daily work update submitted for review",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to submit work update",
    });
  }
};

export const deleteDraftWorkUpdate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await workUpdateService.deleteDraftWorkUpdate(id, userId);

    res.status(200).json({
      success: true,
      message: "Draft work update deleted",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete work update",
    });
  }
};

export const getAllWorkUpdates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await workUpdateService.getAllWorkUpdates(req.query as any);

    res.status(200).json({
      success: true,
      data: result.updates,
      summary: result.summary,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve work updates",
    });
  }
};

export const getWorkUpdateById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await workUpdateService.getWorkUpdateById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message && error.message.includes("permission") ? 403 : 404;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Work update not found",
    });
  }
};

export const approveWorkUpdate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await workUpdateService.approveWorkUpdate(id, userId);

    res.status(200).json({
      success: true,
      message: "Work update approved",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to approve work update",
    });
  }
};

export const requestChanges = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { managerComment } = req.body;

    const result = await workUpdateService.requestChangesOnWorkUpdate(
      id,
      userId,
      managerComment
    );

    res.status(200).json({
      success: true,
      message: "Changes requested on work update",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to request changes",
    });
  }
};
