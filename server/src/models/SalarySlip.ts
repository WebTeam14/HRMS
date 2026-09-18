import mongoose, { Document, Schema } from "mongoose";

export interface ISalarySlip extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: string; // e.g. "January", "February"
  monthIndex: number; // 1-12
  year: number;

  // Attendance & Days Breakdown
  totalDaysInMonth: number;
  presentDays: number;
  paidLeaveDays: number;
  holidaysCount: number;
  lateMarksCount: number;
  lopDays: number;
  payableDays: number;

  // Earnings
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  incentives: number;
  reimbursements: number;
  grossSalary: number; // Pro-rated or Base Gross

  // Deductions
  lopDeduction: number;
  pfDeduction: number;
  taxDeduction: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;

  // Net Pay
  netSalary: number;

  // Status & Metadata
  status: "PAID" | "PROCESSED" | "DRAFT" | "PENDING";
  paymentDate?: Date;
  bankAccountLast4?: string;
  panNumber?: string;
  uanNumber?: string;
  pfNumber?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
    },
    monthIndex: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },

    // Attendance & Days Breakdown
    totalDaysInMonth: {
      type: Number,
      default: 30,
    },
    presentDays: {
      type: Number,
      default: 22,
    },
    paidLeaveDays: {
      type: Number,
      default: 0,
    },
    holidaysCount: {
      type: Number,
      default: 2,
    },
    lateMarksCount: {
      type: Number,
      default: 0,
    },
    lopDays: {
      type: Number,
      default: 0,
    },
    payableDays: {
      type: Number,
      default: 30,
    },

    // Earnings
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    hra: {
      type: Number,
      required: true,
      default: 0,
    },
    specialAllowance: {
      type: Number,
      required: true,
      default: 0,
    },
    incentives: {
      type: Number,
      default: 0,
    },
    reimbursements: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
      default: 0,
    },

    // Deductions
    lopDeduction: {
      type: Number,
      default: 0,
    },
    pfDeduction: {
      type: Number,
      required: true,
      default: 0,
    },
    taxDeduction: {
      type: Number,
      required: true,
      default: 0,
    },
    professionalTax: {
      type: Number,
      required: true,
      default: 200,
    },
    otherDeductions: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      required: true,
      default: 0,
    },

    // Net Pay
    netSalary: {
      type: Number,
      required: true,
      default: 0,
    },

    // Status & Metadata
    status: {
      type: String,
      enum: ["PAID", "PROCESSED", "DRAFT", "PENDING"],
      default: "PROCESSED",
    },
    paymentDate: {
      type: Date,
    },
    bankAccountLast4: {
      type: String,
      default: "8942",
    },
    panNumber: {
      type: String,
      default: "ABCDE1234F",
    },
    uanNumber: {
      type: String,
      default: "100984729104",
    },
    pfNumber: {
      type: String,
      default: "MH/BAN/0049281/000/00392",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

salarySlipSchema.index(
  { employeeId: 1, monthIndex: 1, year: 1 },
  { unique: true }
);

export const SalarySlip = mongoose.model<ISalarySlip>(
  "SalarySlip",
  salarySlipSchema
);
