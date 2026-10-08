import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import * as payrollService from "../services/payrollService";

export const getMyPayslips = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const year = req.query.year ? parseInt(req.query.year as string, 10) : 2026;
    const result = await payrollService.getMyPayslips(userId, year);

    res.status(200).json({
      success: true,
      data: result.slips,
      summary: result.summary,
      packageInfo: result.packageInfo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve salary slips",
    });
  }
};

export const getPayslipById = async (
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
    const slip = await payrollService.getPayslipById(id, userId);

    res.status(200).json({
      success: true,
      data: slip,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || "Salary slip not found",
    });
  }
};

export const getCompanyPayrollOverview = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const overview = await payrollService.getCompanyPayrollOverview();
    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve payroll overview",
    });
  }
};

export const getPayrollSheet = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const monthIndex = req.query.monthIndex ? parseInt(req.query.monthIndex as string, 10) : 9;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : 2026;

    const sheet = await payrollService.getCompanyPayrollSheet(monthIndex, year);
    res.status(200).json({
      success: true,
      data: sheet.slips,
      summary: sheet.summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve company payroll sheet",
    });
  }
};

export const calculatePayroll = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const monthIndex = req.body.monthIndex ? parseInt(req.body.monthIndex, 10) : 9;
    const year = req.body.year ? parseInt(req.body.year, 10) : 2026;

    const result = await payrollService.calculateMonthlyPayroll(monthIndex, year);
    res.status(200).json({
      success: true,
      message: `Monthly payroll successfully computed for month ${monthIndex}/${year}`,
      data: result.slips,
      summary: result.summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate payroll",
    });
  }
};

export const publishPayroll = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const monthIndex = req.body.monthIndex ? parseInt(req.body.monthIndex, 10) : 9;
    const year = req.body.year ? parseInt(req.body.year, 10) : 2026;

    const result = await payrollService.publishMonthlyPayroll(monthIndex, year);
    res.status(200).json({
      success: true,
      message: `Published ${result.updatedCount} salary slips to employee portals`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to publish payroll",
    });
  }
};

export const updateSalarySlip = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await payrollService.updateSalarySlip(id, req.body);
    res.status(200).json({
      success: true,
      message: "Salary slip updated successfully",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update salary slip",
    });
  }
};

export const recordPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await payrollService.recordPaymentProof(id, req.body);
    res.status(200).json({
      success: true,
      message: "Payment disbursement and proof recorded successfully",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to record payment proof",
    });
  }
};

export const raiseQuery = async (
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
    const updated = await payrollService.raiseSalarySlipQuery(id, userId, req.body);
    res.status(201).json({
      success: true,
      message: "Query / problem request submitted to HR successfully",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to raise query on salary slip",
    });
  }
};

export const updateQueryStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const hrUserId = req.user?.userId;
    if (!hrUserId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const queryId = Array.isArray(req.params.queryId)
      ? req.params.queryId[0]
      : req.params.queryId;

    const updated = await payrollService.updateSalarySlipQuery(
      id,
      queryId,
      hrUserId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Employee payroll query updated successfully",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update payroll query",
    });
  }
};

