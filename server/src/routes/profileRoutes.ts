import { Router } from "express";
import {
  getMe,
  updateMe,
  changePassword,
} from "../controllers/profileController";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/profileValidator";

const router = Router();

router.get("/me", authenticate, getMe);

router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  updateMe
);

router.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

export default router;
