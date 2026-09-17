import mongoose, { Document, Schema } from "mongoose";

export interface ILeaveType extends Document {
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leaveTypeSchema = new Schema<ILeaveType>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    defaultDays: {
      type: Number,
      required: true,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

leaveTypeSchema.index({ name: 1 }, { unique: true });
leaveTypeSchema.index({ code: 1 }, { unique: true });
leaveTypeSchema.index({ isActive: 1 });

export const LeaveType = mongoose.model<ILeaveType>("LeaveType", leaveTypeSchema);
