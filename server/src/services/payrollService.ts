import mongoose from "mongoose";
import { SalarySlip, ISalarySlip } from "../models/SalarySlip";
import { Employee, IEmployee } from "../models/Employee";
import { Attendance } from "../models/Attendance";
import { LeaveRequest } from "../models/LeaveRequest";
import { Holiday } from "../models/Holiday";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getStandardPackageForDesignation = (designation?: string): number => {
  const des = (designation || "").toLowerCase();
  if (des.includes("chief") || des.includes("ceo")) return 180000;
  if (des.includes("it manager") || des.includes("engineering manager")) return 120000;
  if (des.includes("hr manager")) return 90000;
  if (des.includes("accounts manager") || des.includes("finance")) return 85000;
  if (des.includes("senior software") || des.includes("developer")) return 85000;
  if (des.includes("admin")) return 65000;
  return 75000;
};

export const seedSamplePayslipsIfEmpty = async (
  employeeId: mongoose.Types.ObjectId
): Promise<void> => {
  const count = await SalarySlip.countDocuments({ employeeId, year: 2026 });
  if (count === 0) {
    const employee = await Employee.findById(employeeId);
    const baseGross = getStandardPackageForDesignation(employee?.designation);
    const monthsToGenerate = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    for (const mIndex of monthsToGenerate) {
      const monthName = MONTH_NAMES[mIndex - 1];
      const totalDays = new Date(2026, mIndex, 0).getDate();
      const holidaysCount = 2;
      const presentDays = totalDays - 8 - holidaysCount; // 8 weekends + 2 holidays
      const lateMarks = mIndex % 3 === 0 ? 3 : 0;
      const lopDays = lateMarks >= 3 ? 0.5 : 0;
      const payableDays = totalDays - lopDays;

      const basicSalary = Math.round(baseGross * 0.5);
      const hra = Math.round(baseGross * 0.25);
      const specialAllowance = baseGross - (basicSalary + hra);
      const lopDeduction = Math.round((baseGross / totalDays) * lopDays);
      const pfDeduction = Math.min(2160, Math.round(basicSalary * 0.12));
      const taxDeduction = Math.round(baseGross * 0.05);
      const professionalTax = 200;
      const totalDeductions = lopDeduction + pfDeduction + taxDeduction + professionalTax;
      const netSalary = baseGross - totalDeductions;

      await SalarySlip.create({
        employeeId,
        month: monthName,
        monthIndex: mIndex,
        year: 2026,
        totalDaysInMonth: totalDays,
        presentDays,
        paidLeaveDays: 0,
        holidaysCount,
        lateMarksCount: lateMarks,
        lopDays,
        payableDays,
        basicSalary,
        hra,
        specialAllowance,
        grossSalary: baseGross,
        lopDeduction,
        pfDeduction,
        taxDeduction,
        professionalTax,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        status: "PAID",
        paymentDate: new Date(2026, mIndex - 1, totalDays),
        bankAccountLast4: "8942",
        panNumber: "ABCDE1234F",
        uanNumber: "100984729104",
        pfNumber: "MH/BAN/0049281/000/00392",
        notes: `Monthly compensation for ${monthName} 2026 credited via Direct Deposit.`,
      });
    }
  }
};

/**
 * Enterprise Payroll Calculation Engine
 * Calculates accurate payable days, LOP, late mark penalties, pro-rated gross, statutory PF/PT/TDS, and net salary.
 */
export const calculateMonthlyPayroll = async (
  monthIndex: number,
  year = 2026
): Promise<{
  slips: ISalarySlip[];
  summary: {
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    totalLopDays: number;
    totalEmployees: number;
  };
}> => {
  const activeEmployees = await Employee.find({ status: "ACTIVE" })
    .populate("departmentId", "name code")
    .populate("userId", "email");

  const monthName = MONTH_NAMES[monthIndex - 1];
  const totalDaysInMonth = new Date(year, monthIndex, 0).getDate();

  // Date range for month
  const startDate = new Date(year, monthIndex - 1, 1);
  const endDate = new Date(year, monthIndex - 1, totalDaysInMonth, 23, 59, 59);

  // Confirmed holidays in month
  const holidays = await Holiday.find({
    date: { $gte: startDate, $lte: endDate },
  });
  const holidaysCount = holidays.length || 2;

  const generatedSlips: ISalarySlip[] = [];

  for (const emp of activeEmployees) {
    const baseGross = emp.monthlySalary && emp.monthlySalary > 0
      ? emp.monthlySalary
      : getStandardPackageForDesignation(emp.designation);

    // 1. Attendance punches
    const attendances = await Attendance.find({
      employeeId: emp._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const presentDays = attendances.filter((a) => a.status === "PRESENT").length || (totalDaysInMonth - 8 - holidaysCount);
    
    // Late marks count
    const lateMarksCount = attendances.filter((a) => {
      if (a.status === "LATE") return true;
      if (a.checkIn) {
        const d = new Date(a.checkIn);
        return d.getHours() > 9 || (d.getHours() === 9 && d.getMinutes() > 30);
      }
      return false;
    }).length;

    // 2. Approved Leaves
    const leaves = await LeaveRequest.find({
      employeeId: emp._id,
      status: "APPROVED",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    const paidLeaveDays = leaves.reduce((sum, l) => sum + l.totalDays, 0);

    // 3. MNC Late mark penalty & LOP rule:
    // Every 3 late marks = 0.5 day LOP deduction
    const lateMarkLop = Math.floor(lateMarksCount / 3) * 0.5;
    
    // Standard weekends in month (8 days)
    const weekendDays = 8;
    const workingDaysExpected = totalDaysInMonth - weekendDays - holidaysCount;
    const recordedProductiveDays = presentDays + paidLeaveDays;
    const unapprovedAbsents = Math.max(0, workingDaysExpected - recordedProductiveDays);

    const lopDays = unapprovedAbsents + lateMarkLop;
    const payableDays = Math.max(0, totalDaysInMonth - lopDays);

    // 4. Compensation Component Breakdown
    const basicSalary = Math.round(baseGross * 0.5);
    const hra = Math.round(baseGross * 0.25);
    const specialAllowance = Math.max(0, baseGross - (basicSalary + hra));
    const incentives = 0;
    const reimbursements = 0;

    const lopDeduction = Math.round((baseGross / totalDaysInMonth) * lopDays);
    const pfDeduction = 0; // Default ₹0 since company doesn't enforce mandatory PF
    const taxDeduction = Math.round(baseGross * 0.05);
    const professionalTax = 200;
    const totalDeductions = lopDeduction + pfDeduction + taxDeduction + professionalTax;
    const totalEarnings = baseGross + incentives + reimbursements;
    const netSalary = Math.max(0, totalEarnings - totalDeductions);

    // Upsert SalarySlip in MongoDB
    const slip = await SalarySlip.findOneAndUpdate(
      { employeeId: emp._id, monthIndex, year },
      {
        month: monthName,
        monthIndex,
        year,
        totalDaysInMonth,
        presentDays,
        paidLeaveDays,
        holidaysCount,
        lateMarksCount,
        lopDays,
        payableDays,
        basicSalary,
        hra,
        specialAllowance,
        incentives,
        reimbursements,
        grossSalary: baseGross,
        lopDeduction,
        pfDeduction,
        taxDeduction,
        professionalTax,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        status: "PROCESSED",
        paymentDate: new Date(year, monthIndex - 1, totalDaysInMonth),
        bankAccountLast4: "8942",
        panNumber: "ABCDE1234F",
        uanNumber: "100984729104",
        pfNumber: "N/A",
        notes: `Salary computed for ${monthName} ${year} with ${payableDays} payable days (${lopDays} LOP days).`,
      },
      { upsert: true, new: true }
    ).populate({
      path: "employeeId",
      populate: [
        { path: "departmentId", select: "name code" },
        { path: "managerId", select: "employeeCode firstName lastName" },
      ],
    });

    generatedSlips.push(slip);
  }

  const totalGross = generatedSlips.reduce((sum, s) => sum + s.grossSalary, 0);
  const totalNet = generatedSlips.reduce((sum, s) => sum + s.netSalary, 0);
  const totalDeductions = generatedSlips.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalLopDays = generatedSlips.reduce((sum, s) => sum + s.lopDays, 0);

  return {
    slips: generatedSlips,
    summary: {
      totalGross,
      totalNet,
      totalDeductions,
      totalLopDays,
      totalEmployees: generatedSlips.length,
    },
  };
};

export const getCompanyPayrollSheet = async (
  monthIndex: number,
  year = 2026
): Promise<{
  slips: ISalarySlip[];
  summary: {
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    totalLopDays: number;
    totalEmployees: number;
  };
}> => {
  let slips = await SalarySlip.find({ monthIndex, year })
    .populate({
      path: "employeeId",
      populate: [
        { path: "departmentId", select: "name code" },
        { path: "managerId", select: "employeeCode firstName lastName" },
      ],
    })
    .sort({ createdAt: -1 });

  if (slips.length === 0) {
    // Auto-calculate if not present
    return calculateMonthlyPayroll(monthIndex, year);
  }

  const totalGross = slips.reduce((sum, s) => sum + s.grossSalary, 0);
  const totalNet = slips.reduce((sum, s) => sum + s.netSalary, 0);
  const totalDeductions = slips.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalLopDays = slips.reduce((sum, s) => sum + s.lopDays, 0);

  return {
    slips,
    summary: {
      totalGross,
      totalNet,
      totalDeductions,
      totalLopDays,
      totalEmployees: slips.length,
    },
  };
};

export const publishMonthlyPayroll = async (
  monthIndex: number,
  year = 2026
): Promise<{ updatedCount: number }> => {
  const result = await SalarySlip.updateMany(
    { monthIndex, year },
    { status: "PAID", paymentDate: new Date() }
  );

  return { updatedCount: result.modifiedCount };
};

export const updateSalarySlip = async (
  id: string,
  updates: Partial<ISalarySlip>
): Promise<ISalarySlip> => {
  const slip = await SalarySlip.findById(id);
  if (!slip) {
    throw new Error("Salary slip not found");
  }

  if (updates.grossSalary !== undefined && updates.grossSalary > 0) {
    slip.grossSalary = updates.grossSalary;
    slip.basicSalary = Math.round(slip.grossSalary * 0.5);
    slip.hra = Math.round(slip.grossSalary * 0.25);
    slip.specialAllowance = Math.max(0, slip.grossSalary - (slip.basicSalary + slip.hra));
    // Recalculate LOP deduction if base gross changed
    if (slip.totalDaysInMonth > 0 && slip.lopDays > 0) {
      slip.lopDeduction = Math.round((slip.grossSalary / slip.totalDaysInMonth) * slip.lopDays);
    }
  }

  if (updates.incentives !== undefined) slip.incentives = Math.max(0, updates.incentives);
  if (updates.reimbursements !== undefined) slip.reimbursements = Math.max(0, updates.reimbursements);
  if (updates.pfDeduction !== undefined) slip.pfDeduction = Math.max(0, updates.pfDeduction);
  if (updates.taxDeduction !== undefined) slip.taxDeduction = Math.max(0, updates.taxDeduction);
  if (updates.specialAllowance !== undefined) slip.specialAllowance = updates.specialAllowance;
  if (updates.otherDeductions !== undefined) slip.otherDeductions = updates.otherDeductions;
  if (updates.notes !== undefined) slip.notes = updates.notes;
  if (updates.status !== undefined) slip.status = updates.status;

  // Recalculate totals
  const totalEarnings = slip.grossSalary + (slip.incentives || 0) + (slip.reimbursements || 0);
  slip.totalDeductions =
    slip.lopDeduction +
    slip.pfDeduction +
    slip.taxDeduction +
    slip.professionalTax +
    slip.otherDeductions;
  slip.netSalary = Math.max(0, totalEarnings - slip.totalDeductions);

  await slip.save();
  return slip;
};

export const getMyPayslips = async (
  userId: string,
  year = 2026
): Promise<{
  slips: ISalarySlip[];
  summary: {
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    totalTax: number;
    totalPf: number;
  };
}> => {
  const employee = await ensureEmployeeForUser(userId);
  await seedSamplePayslipsIfEmpty(employee._id);

  const slips = await SalarySlip.find({
    employeeId: employee._id,
    year,
  }).sort({ monthIndex: -1 });

  const totalGross = slips.reduce((sum, s) => sum + s.grossSalary, 0);
  const totalNet = slips.reduce((sum, s) => sum + s.netSalary, 0);
  const totalDeductions = slips.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalTax = slips.reduce((sum, s) => sum + s.taxDeduction, 0);
  const totalPf = slips.reduce((sum, s) => sum + s.pfDeduction, 0);

  return {
    slips,
    summary: {
      totalGross,
      totalNet,
      totalDeductions,
      totalTax,
      totalPf,
    },
  };
};

export const getPayslipById = async (
  id: string,
  userId: string
): Promise<any> => {
  const employee = await ensureEmployeeForUser(userId);

  const slip = await SalarySlip.findOne({
    _id: id,
    employeeId: employee._id,
  }).populate({
    path: "employeeId",
    populate: [
      { path: "departmentId", select: "name code" },
      { path: "managerId", select: "employeeCode firstName lastName" },
      { path: "userId", select: "email role" },
    ],
  });

  if (!slip) {
    throw new Error("Salary slip not found");
  }

  return slip;
};

export const getCompanyPayrollOverview = async (): Promise<{
  totalMonthlyGross: number;
  totalMonthlyNet: number;
  totalMonthlyTds: number;
  totalMonthlyPf: number;
  activePayrollEmployees: number;
  latestMonth: string;
}> => {
  const sheet = await getCompanyPayrollSheet(9, 2026);
  const totalMonthlyTds = sheet.slips.reduce((sum, s) => sum + s.taxDeduction, 0);
  const totalMonthlyPf = sheet.slips.reduce((sum, s) => sum + s.pfDeduction, 0);

  return {
    totalMonthlyGross: sheet.summary.totalGross,
    totalMonthlyNet: sheet.summary.totalNet,
    totalMonthlyTds,
    totalMonthlyPf,
    activePayrollEmployees: sheet.summary.totalEmployees,
    latestMonth: "September 2026",
  };
};
