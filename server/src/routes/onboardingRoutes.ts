import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { PERMISSIONS } from "../utils/permissions";
import {
  initiateOnboardingSchema,
  updateTaskStatusSchema,
  uploadDocumentSchema,
  verifyDocumentSchema,
} from "../validators/onboardingValidator";
import * as onboardingController from "../controllers/onboardingController";

const router = Router();

// List all onboardings (management view)
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.ONBOARDING_VIEW),
  onboardingController.listOnboardings as any
);

// Get onboarding details by employee ID
router.get(
  "/:employeeId",
  authenticate,
  requirePermission(PERMISSIONS.ONBOARDING_VIEW),
  onboardingController.getOnboardingByEmployee as any
);

// Initiate onboarding for an employee
router.post(
  "/:employeeId/initiate",
  authenticate,
  requirePermission(PERMISSIONS.ONBOARDING_INITIATE),
  validate(initiateOnboardingSchema),
  onboardingController.initiateOnboarding as any
);

// Update status of an onboarding task
router.patch(
  "/:employeeId/tasks/:taskId",
  authenticate,
  requirePermission(PERMISSIONS.ONBOARDING_UPDATE_TASK),
  validate(updateTaskStatusSchema),
  onboardingController.updateTaskStatus as any
);

// Upload onboarding document
router.post(
  "/:employeeId/documents",
  authenticate,
  requirePermission(PERMISSIONS.ONBOARDING_VIEW),
  validate(uploadDocumentSchema),
  onboardingController.uploadDocument as any
);

// Verify or reject onboarding document (HR/Admin only)
router.patch(
  "/documents/:docId/verify",
  authenticate,
  requirePermission(PERMISSIONS.ONBOARDING_VERIFY_DOC),
  validate(verifyDocumentSchema),
  onboardingController.verifyDocument as any
);

export default router;
