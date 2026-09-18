import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { PERMISSIONS } from "../utils/permissions";
import {
  leaveTypeSchema,
  updateLeaveTypeSchema,
  updateLeaveTypeStatusSchema,
} from "../validators/leaveValidator";
import * as leaveTypeController from "../controllers/leaveTypeController";

const router = Router();

// Get all leave types (active or all)
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_TYPE_VIEW),
  leaveTypeController.getLeaveTypes as any
);

// Get single leave type
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_TYPE_VIEW),
  leaveTypeController.getLeaveTypeById as any
);

// Create new leave type
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_TYPE_CREATE),
  validate(leaveTypeSchema),
  leaveTypeController.createLeaveType as any
);

// Update leave type details
router.patch(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_TYPE_UPDATE),
  validate(updateLeaveTypeSchema),
  leaveTypeController.updateLeaveType as any
);

// Update active/inactive status
router.patch(
  "/:id/status",
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_TYPE_UPDATE),
  validate(updateLeaveTypeStatusSchema),
  leaveTypeController.updateLeaveTypeStatus as any
);

export default router;
