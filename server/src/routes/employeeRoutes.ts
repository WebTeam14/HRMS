
import { Router } from "express";

import {
  createEmployeeController,
  listEmployees,
  getEmployee,
  editEmployee,
  changeEmployeeStatus,
  getCompanyDirectory,
} from "../controllers/employeeController";

import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { validate } from "../middleware/validate";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from "../validators/employeeValidator";

import { PERMISSIONS } from "../utils/permissions";

const router = Router();

// Organization directory (accessible to all authenticated employees)
router.get(
  "/directory",
  authenticate,
  getCompanyDirectory
);

router.get(
  "/",
  authenticate,
  requirePermission(
    PERMISSIONS.EMPLOYEE_VIEW
  ),
  listEmployees
);

router.get(
  "/:id",
  authenticate,
  requirePermission(
    PERMISSIONS.EMPLOYEE_VIEW
  ),
  getEmployee
);

router.post(
  "/",
  authenticate,
  requirePermission(
    PERMISSIONS.EMPLOYEE_CREATE
  ),
  validate(createEmployeeSchema),
  createEmployeeController
);

router.patch(
  "/:id",
  authenticate,
  requirePermission(
    PERMISSIONS.EMPLOYEE_UPDATE
  ),
  validate(updateEmployeeSchema),
  editEmployee
);

router.patch(
  "/:id/status",
  authenticate,
  requirePermission(
    PERMISSIONS.EMPLOYEE_UPDATE
  ),
  validate(updateEmployeeStatusSchema),
  changeEmployeeStatus
);

export default router;