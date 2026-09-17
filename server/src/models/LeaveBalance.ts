import mongoose, { Document, Schema } from "mongoose";

export interface ILeaveBalance extends Document {
  employeeId: mongoose.Types.ObjectId;
  leaveTypeId: mongoose.Types.ObjectId;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    allocatedDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingDays: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: One balance record per employee, leave type and year
leaveBalanceSchema.index(
  { employeeId: 1, leaveTypeId: 1, year: 1 },
  { unique: true }
);
leaveBalanceSchema.index({ employeeId: 1, year: 1 });

export const LeaveBalance = mongoose.model<ILeaveBalance>(
  "LeaveBalance",
  leaveBalanceSchema
);
