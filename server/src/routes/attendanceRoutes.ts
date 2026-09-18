import { Router } from "express";
import {
  handleCheckIn,
  handleCheckOut,
  handleGetToday,
  handleGetMyHistory,
  handleGetAllAttendance,
  handleGetAttendanceById,
  handleUpdateAttendance,
} from "../controllers/attendanceController";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";
import { PERMISSIONS } from "../utils/permissions";

const router = Router();

// Employee Self-Service Endpoints
router.post(
  "/check-in",
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_CHECK_IN),
  handleCheckIn
);

router.post(
  "/check-out",
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_CHECK_OUT),
  handleCheckOut
);

router.get(
  "/today",
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW_SELF),
  handleGetToday
);

router.get(
  "/my-history",
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW_SELF),
  handleGetMyHistory
);

// Organization / HR / Admin Management Endpoints
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  handleGetAllAttendance
);

router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  handleGetAttendanceById
);

router.patch(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_UPDATE),
  handleUpdateAttendance
);

export default router;
