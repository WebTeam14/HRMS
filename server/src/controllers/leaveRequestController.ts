import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import * as leaveRequestService from "../services/leaveRequestService";

export const applyLeave = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const leaveRequest = await leaveRequestService.applyLeave(userId, req.body);

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      data: leaveRequest,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to submit leave application",
    });
  }
};

export const getMyLeaveRequests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const result = await leaveRequestService.getMyLeaveRequests(userId, req.query as any);

    res.status(200).json({
      success: true,
      data: result.requests,
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
      message: error.message || "Failed to retrieve leave requests",
    });
  }
};

export const getLeaveRequestById = async (
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
    const request = await leaveRequestService.getLeaveRequestById(id, userId, userRole);

    if (!request) {
      res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    const statusCode = error.message && error.message.includes("permission") ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve leave request",
    });
  }
};

export const cancelLeaveRequest = async (
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
    const request = await leaveRequestService.cancelLeaveRequest(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: "Leave request cancelled successfully",
      data: request,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel leave request",
    });
  }
};

export const getAllLeaveRequests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await leaveRequestService.getAllLeaveRequests(req.query as any);

    res.status(200).json({
      success: true,
      data: result.requests,
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
      message: error.message || "Failed to retrieve organization leave requests",
    });
  }
};

export const approveLeaveRequest = async (
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
    const request = await leaveRequestService.approveLeaveRequest(id, userId);

    res.status(200).json({
      success: true,
      message: "Leave request approved successfully",
      data: request,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to approve leave request",
    });
  }
};

export const rejectLeaveRequest = async (
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
    const { rejectionReason } = req.body;

    const request = await leaveRequestService.rejectLeaveRequest(id, userId, rejectionReason);

    res.status(200).json({
      success: true,
      message: "Leave request rejected",
      data: request,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reject leave request",
    });
  }
};
