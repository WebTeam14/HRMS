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
router.patch("/slips/:id/payment", authenticate, payrollController.recordPayment);

// Employee Queries & HR Resolution
router.post("/slips/:id/queries", authenticate, payrollController.raiseQuery);
router.patch("/slips/:id/queries/:queryId", authenticate, payrollController.updateQueryStatus);

export default router;

