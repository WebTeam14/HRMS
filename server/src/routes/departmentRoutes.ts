import { Router } from "express";
import {
  listDepartments,
  getDepartment,
  createDepartmentController,
  editDepartment,
  changeDepartmentStatus,
} from "../controllers/departmentController";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  updateDepartmentStatusSchema,
} from "../validators/departmentValidator";
import { PERMISSIONS } from "../utils/permissions";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.DEPARTMENT_VIEW),
  listDepartments
);

router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.DEPARTMENT_VIEW),
  getDepartment
);

router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.DEPARTMENT_CREATE),
  validate(createDepartmentSchema),
  createDepartmentController
);

router.patch(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.DEPARTMENT_UPDATE),
  validate(updateDepartmentSchema),
  editDepartment
);

router.patch(
  "/:id/status",
  authenticate,
  requirePermission(PERMISSIONS.DEPARTMENT_UPDATE),
  validate(updateDepartmentStatusSchema),
  changeDepartmentStatus
);

export default router;