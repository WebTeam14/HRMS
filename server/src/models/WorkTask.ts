import mongoose, { Document, Schema } from "mongoose";

export type WorkTaskStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING";
export type WorkTaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface IWorkTask extends Document {
  workUpdateId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: WorkTaskStatus;
  priority: WorkTaskPriority;
  estimatedHours: number;
  actualHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const workTaskSchema = new Schema<IWorkTask>(
  {
    workUpdateId: {
      type: Schema.Types.ObjectId,
      ref: "WorkUpdate",
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["COMPLETED", "IN_PROGRESS", "PENDING"],
      default: "COMPLETED",
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
      required: true,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

workTaskSchema.index({ workUpdateId: 1 });
workTaskSchema.index({ employeeId: 1 });

export const WorkTask = mongoose.model<IWorkTask>("WorkTask", workTaskSchema);
