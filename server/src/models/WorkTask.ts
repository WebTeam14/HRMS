import mongoose, { Document, Schema } from "mongoose";

export type WorkTaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type WorkTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface IWorkTask extends Document {
  workUpdateId?: mongoose.Types.ObjectId;   // optional — tasks can exist independently
  employeeId: mongoose.Types.ObjectId;       // assignee
  assignedById?: mongoose.Types.ObjectId;   // who assigned it (manager)
  title: string;
  description?: string;
  status: WorkTaskStatus;
  priority: WorkTaskPriority;
  dueDate?: Date;
  estimatedHours: number;
  actualHours: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workTaskSchema = new Schema<IWorkTask>(
  {
    workUpdateId: {
      type: Schema.Types.ObjectId,
      ref: "WorkUpdate",
      required: false,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    assignedById: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
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
      enum: ["TODO", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
      default: "TODO",
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      required: true,
    },
    dueDate: {
      type: Date,
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
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

workTaskSchema.index({ workUpdateId: 1 });
workTaskSchema.index({ employeeId: 1 });
workTaskSchema.index({ assignedById: 1 });
workTaskSchema.index({ status: 1 });
workTaskSchema.index({ dueDate: 1 });

export const WorkTask = mongoose.model<IWorkTask>("WorkTask", workTaskSchema);

