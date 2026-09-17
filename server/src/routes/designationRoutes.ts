import { Router } from "express";
import {
  listDesignations,
  getDesignation,
  createDesignationController,
  editDesignation,
  changeDesignationStatus,
} from "../controllers/designationController";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createDesignationSchema,
  updateDesignationSchema,
  updateDesignationStatusSchema,
} from "../validators/designationValidator";
import { PERMISSIONS } from "../utils/permissions";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.DESIGNATION_VIEW),
  listDesignations
);

router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.DESIGNATION_VIEW),
  getDesignation
);

router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.DESIGNATION_CREATE),
  validate(createDesignationSchema),
  createDesignationController
);

router.patch(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.DESIGNATION_UPDATE),
  validate(updateDesignationSchema),
  editDesignation
);

router.patch(
  "/:id/status",
  authenticate,
  requirePermission(PERMISSIONS.DESIGNATION_UPDATE),
  validate(updateDesignationStatusSchema),
  changeDesignationStatus
);

export default router;
