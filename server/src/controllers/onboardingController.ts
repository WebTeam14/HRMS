import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import * as onboardingService from "../services/onboardingService";

export const initiateOnboarding = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employeeId = String(req.params.employeeId);
    const result = await onboardingService.initiateOnboarding(
      employeeId,
      req.body,
      req.user?.userId
    );

    res.status(201).json({
      success: true,
      message: "Onboarding initiated successfully",
      data: result,
    });
  } catch (error: any) {
    const status = error.message === "ONBOARDING_ALREADY_INITIATED" ? 409 : 400;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to initiate onboarding",
    });
  }
};

export const getOnboardingByEmployee = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employeeId = String(req.params.employeeId);
    const result = await onboardingService.getOnboardingByEmployeeId(employeeId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const status = error.message === "ONBOARDING_NOT_FOUND" ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to get onboarding details",
    });
  }
};

export const listOnboardings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await onboardingService.listOnboardings(req.query as any);

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to list onboarding records",
    });
  }
};

export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employeeId = String(req.params.employeeId);
    const taskId = String(req.params.taskId);
    const { status } = req.body;

    const result = await onboardingService.updateOnboardingTaskStatus(
      employeeId,
      taskId,
      status,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: "Onboarding task updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update onboarding task",
    });
  }
};

export const uploadDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employeeId = String(req.params.employeeId);
    const result = await onboardingService.uploadOnboardingDocument(
      employeeId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to upload document",
    });
  }
};

export const verifyDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const docId = String(req.params.docId);
    const { verificationStatus, rejectionReason } = req.body;

    const result = await onboardingService.verifyOnboardingDocument(
      docId,
      verificationStatus,
      rejectionReason,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: `Document ${verificationStatus.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to verify document",
    });
  }
};
