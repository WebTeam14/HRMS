import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { PERMISSIONS } from "../utils/permissions";
import {
  initiateRelievingSchema,
  approveRelievingSchema,
  updateClearanceItemSchema,
  fnfSettlementSchema,
} from "../validators/relievingValidator";
import * as relievingController from "../controllers/relievingController";

const router = Router();

// List all relieving requests
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_VIEW),
  relievingController.listRelievingRequests as any
);

// Get relieving details by employee ID (self/manager view)
router.get(
  "/employee/:employeeId",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_VIEW),
  relievingController.getRelievingByEmployee as any
);

// Get relieving details by request ID
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_VIEW),
  relievingController.getRelievingDetails as any
);

// Initiate resignation/relieving request
router.post(
  "/:employeeId/initiate",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_INITIATE),
  validate(initiateRelievingSchema),
  relievingController.initiateRelieving as any
);

// Approve resignation request (HR/Admin) -> moves to CLEARANCE_PENDING
router.patch(
  "/:id/approve",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_APPROVE),
  validate(approveRelievingSchema),
  relievingController.approveRelieving as any
);

// Update a clearance item status (scoped by department)
router.patch(
  "/:id/clearance/:itemId",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_CLEARANCE),
  validate(updateClearanceItemSchema),
  relievingController.updateClearanceItem as any
);

// Create or update Full & Final (FnF) Settlement (Accounts/HR/Admin)
router.post(
  "/:id/settlement",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_SETTLE),
  validate(fnfSettlementSchema),
  relievingController.createOrUpdateSettlement as any
);

// Finalize relief: marks RELIEVED and deactivates employee user login
router.post(
  "/:id/finalize",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_APPROVE),
  relievingController.finalizeRelief as any
);

// Get structured data for generating relieving letter
router.get(
  "/:id/relieving-letter",
  authenticate,
  requirePermission(PERMISSIONS.RELIEVING_VIEW),
  relievingController.getRelievingLetter as any
);

export default router;
