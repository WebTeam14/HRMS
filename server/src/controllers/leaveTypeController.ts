import { Request, Response } from "express";
import * as leaveTypeService from "../services/leaveTypeService";

export const getLeaveTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const onlyActive = req.query.active === "true";
    const leaveTypes = await leaveTypeService.getLeaveTypes(onlyActive);

    res.status(200).json({
      success: true,
      data: leaveTypes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve leave types",
    });
  }
};

export const getLeaveTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const leaveType = await leaveTypeService.getLeaveTypeById(id);

    if (!leaveType) {
      res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: leaveType,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve leave type",
    });
  }
};

export const createLeaveType = async (req: Request, res: Response): Promise<void> => {
  try {
    const leaveType = await leaveTypeService.createLeaveType(req.body);

    res.status(201).json({
      success: true,
      message: "Leave type created successfully",
      data: leaveType,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create leave type",
    });
  }
};

export const updateLeaveType = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const leaveType = await leaveTypeService.updateLeaveType(id, req.body);

    if (!leaveType) {
      res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Leave type updated successfully",
      data: leaveType,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update leave type",
    });
  }
};

export const updateLeaveTypeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { isActive } = req.body;

    const leaveType = await leaveTypeService.updateLeaveTypeStatus(id, isActive);

    if (!leaveType) {
      res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Leave type ${isActive ? "activated" : "deactivated"} successfully`,
      data: leaveType,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update leave type status",
    });
  }
};
