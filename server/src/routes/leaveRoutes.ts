import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { PERMISSIONS } from "../utils/permissions";
import {
  applyLeaveSchema,
  rejectLeaveSchema,
} from "../validators/leaveValidator";
import * as leaveRequestController from "../controllers/leaveRequestController";
import * as leaveBalanceController from "../controllers/leaveBalanceController";

const router = Router();

// ==========================================
// EMPLOYEE SELF-SERVICE & LEAVE BALANCES
// ==========================================

// Get my leave balances
router.get(
  "/balances/me",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_BALANCE_VIEW),
  leaveBalanceController.getMyLeaveBalances as any
);

// Get specific employee leave balances (HR / Admin)
router.get(
  "/balances/:employeeId",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_BALANCE_VIEW),
  leaveBalanceController.getEmployeeLeaveBalances as any
);

// Get my leave request history
router.get(
  "/my",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_VIEW_SELF),
  leaveRequestController.getMyLeaveRequests as any
);

// Apply for leave
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_APPLY),
  validate(applyLeaveSchema),
  leaveRequestController.applyLeave as any
);

// ==========================================
// HR / MANAGEMENT REQUESTS & APPROVALS
// ==========================================

// Get all organization leave requests
router.get(
  "/requests",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_VIEW),
  leaveRequestController.getAllLeaveRequests as any
);

// Approve a leave request
router.patch(
  "/requests/:id/approve",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_APPROVE),
  leaveRequestController.approveLeaveRequest as any
);

// Reject a leave request with reason
router.patch(
  "/requests/:id/reject",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_REJECT),
  validate(rejectLeaveSchema),
  leaveRequestController.rejectLeaveRequest as any
);

// ==========================================
// INDIVIDUAL REQUEST OPERATIONS
// ==========================================

// Cancel a leave request (Employee self or HR)
router.patch(
  "/:id/cancel",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_CANCEL),
  leaveRequestController.cancelLeaveRequest as any
);

// Get single leave request details
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_VIEW_SELF),
  leaveRequestController.getLeaveRequestById as any
);

export default router;
