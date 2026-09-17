import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as holidayController from "../controllers/holidayController";

const router = Router();

// All authenticated employees can view company holidays
router.get("/", authenticate, holidayController.getHolidays);

// Management can create holidays
router.post("/", authenticate, holidayController.createHoliday);

export default router;
