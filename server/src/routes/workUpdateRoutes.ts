import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { PERMISSIONS } from "../utils/permissions";
import {
  createWorkUpdateSchema,
  updateWorkUpdateSchema,
  createTaskSchema,
  updateTaskSchema,
  requestChangesSchema,
} from "../validators/workUpdateValidator";
import * as workUpdateController from "../controllers/workUpdateController";
import * as workTaskController from "../controllers/workTaskController";

const router = Router();

// ==========================================
// WORK UPDATE ROUTES
// ==========================================

// Create new work update (Draft or Submitted)
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_CREATE),
  validate(createWorkUpdateSchema),
  workUpdateController.createWorkUpdate as any
);

// Get my work updates
router.get(
  "/my",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_VIEW_SELF),
  workUpdateController.getMyWorkUpdates as any
);

// Get all work updates (Management)
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_VIEW),
  workUpdateController.getAllWorkUpdates as any
);

// Get single work update details
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_VIEW_SELF),
  workUpdateController.getWorkUpdateById as any
);

// Update draft / changes requested work update
router.patch(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_UPDATE),
  validate(updateWorkUpdateSchema),
  workUpdateController.updateWorkUpdate as any
);

// Submit work update for review
router.post(
  "/:id/submit",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_SUBMIT),
  workUpdateController.submitWorkUpdate as any
);

// Delete draft work update
router.delete(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_DELETE),
  workUpdateController.deleteDraftWorkUpdate as any
);

// Approve work update (Management)
router.post(
  "/:id/approve",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_APPROVE),
  workUpdateController.approveWorkUpdate as any
);

// Request changes on work update (Management)
router.post(
  "/:id/request-changes",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_REQUEST_CHANGES),
  validate(requestChangesSchema),
  workUpdateController.requestChanges as any
);

// ==========================================
// WORK TASK SUB-ROUTES
// ==========================================

// Add task to work update
router.post(
  "/:id/tasks",
  authenticate,
  requirePermission(PERMISSIONS.WORK_TASK_CREATE),
  validate(createTaskSchema),
  workTaskController.createTask as any
);

// Get tasks for work update
router.get(
  "/:id/tasks",
  authenticate,
  requirePermission(PERMISSIONS.WORK_UPDATE_VIEW_SELF),
  workTaskController.getTasks as any
);

// Update task in work update
router.patch(
  "/:id/tasks/:taskId",
  authenticate,
  requirePermission(PERMISSIONS.WORK_TASK_UPDATE),
  validate(updateTaskSchema),
  workTaskController.updateTask as any
);

// Delete task from work update
router.delete(
  "/:id/tasks/:taskId",
  authenticate,
  requirePermission(PERMISSIONS.WORK_TASK_DELETE),
  workTaskController.deleteTask as any
);

export default router;
