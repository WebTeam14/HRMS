import { Router } from "express";

import {
  employeeTest,
  payrollTest,
  hrTest,
} from "../controllers/testController";

import { authenticate } from "../middleware/authenticate";

import { requirePermission } from "../middleware/authorize";

import { requireRole } from "../middleware/authorizeRole";

import { PERMISSIONS } from "../utils/permissions";

import { ROLES } from "../utils/roles";

const router = Router();

/*
 * Any authenticated user
 */
router.get(
  "/authenticated",
  authenticate,
  employeeTest
);

/*
 * Requires payroll.view
 */
router.get(
  "/payroll",
  authenticate,
  requirePermission(PERMISSIONS.PAYROLL_VIEW),
  payrollTest
);

/*
 * Requires HR or ADMIN role
 */
router.get(
  "/hr-only",
  authenticate,
  requireRole(
    ROLES.HR,
    ROLES.ADMIN
  ),
  hrTest
);

export default router;