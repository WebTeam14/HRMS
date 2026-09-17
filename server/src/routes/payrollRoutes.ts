import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as payrollController from "../controllers/payrollController";

const router = Router();

// Employee self-service
router.get("/my-slips", authenticate, payrollController.getMyPayslips);
router.get("/my-slips/:id", authenticate, payrollController.getPayslipById);

// Overview
router.get("/overview", authenticate, payrollController.getCompanyPayrollOverview);

// HR / Management Payroll Engine
router.get("/sheet", authenticate, payrollController.getPayrollSheet);
router.post("/calculate", authenticate, payrollController.calculatePayroll);
router.post("/publish", authenticate, payrollController.publishPayroll);
router.patch("/slips/:id", authenticate, payrollController.updateSalarySlip);

export default router;
