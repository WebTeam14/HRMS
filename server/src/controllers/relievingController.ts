import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import * as relievingService from "../services/relievingService";

export const initiateRelieving = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employeeId = String(req.params.employeeId);
    const result = await relievingService.initiateRelieving(
      employeeId,
      req.body,
      req.user?.userId
    );

    res.status(201).json({
      success: true,
      message: "Relieving request initiated successfully",
      data: result,
    });
  } catch (error: any) {
    const status = error.message === "ACTIVE_RELIEVING_REQUEST_EXISTS" ? 409 : 400;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to initiate relieving request",
    });
  }
};

export const getRelievingDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const result = await relievingService.getRelievingById(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const status = error.message === "RELIEVING_NOT_FOUND" ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to get relieving details",
    });
  }
};

export const getRelievingByEmployee = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employeeId = String(req.params.employeeId);
    const result = await relievingService.getRelievingByEmployeeId(employeeId);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "No relieving record found for this employee",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get relieving details",
    });
  }
};

export const listRelievingRequests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await relievingService.listRelievingRequests(req.query as any);

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to list relieving requests",
    });
  }
};

export const approveRelieving = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { approvalRemarks } = req.body;

    const result = await relievingService.approveRelieving(
      id,
      approvalRemarks,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: "Relieving request approved and clearance checklist opened",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to approve relieving request",
    });
  }
};

export const updateClearanceItem = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const itemId = String(req.params.itemId);
    const { status, remarks } = req.body;

    const result = await relievingService.updateClearanceItemStatus(
      id,
      itemId,
      status,
      remarks,
      { userId: req.user!.userId, role: req.user!.role }
    );

    res.status(200).json({
      success: true,
      message: "Clearance item updated successfully",
      data: result,
    });
  } catch (error: any) {
    const isAuth = error.message?.includes("UNAUTHORIZED_DEPARTMENT");
    res.status(isAuth ? 403 : 400).json({
      success: false,
      message: error.message || "Failed to update clearance item",
    });
  }
};

export const createOrUpdateSettlement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const result = await relievingService.createOrUpdateFnFSettlement(
      id,
      req.body,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: "Full & Final settlement saved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to save settlement",
    });
  }
};

export const finalizeRelief = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const result = await relievingService.finalizeRelief(id, req.user!.userId);

    res.status(200).json({
      success: true,
      message: "Employee successfully relieved and login access deactivated",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to finalize employee relief",
    });
  }
};

export const getRelievingLetter = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const letterData = await relievingService.generateRelievingLetterData(id);

    res.status(200).json({
      success: true,
      data: letterData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to generate relieving letter",
    });
  }
};
