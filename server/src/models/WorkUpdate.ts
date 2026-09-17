import mongoose, { Document, Schema } from "mongoose";

export type WorkUpdateStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export interface IWorkUpdate extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  summary: string;
  accomplishments?: string;
  blockers?: string;
  nextDayPlan?: string;
  totalHours: number;
  status: WorkUpdateStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  managerComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workUpdateSchema = new Schema<IWorkUpdate>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    accomplishments: {
      type: String,
      trim: true,
    },
    blockers: {
      type: String,
      trim: true,
    },
    nextDayPlan: {
      type: String,
      trim: true,
    },
    totalHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "APPROVED", "CHANGES_REQUESTED"],
      default: "DRAFT",
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    managerComment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One daily work update per employee per date
workUpdateSchema.index({ employeeId: 1, date: 1 }, { unique: true });
workUpdateSchema.index({ employeeId: 1, createdAt: -1 });
workUpdateSchema.index({ date: 1, status: 1 });
workUpdateSchema.index({ status: 1 });

export const WorkUpdate = mongoose.model<IWorkUpdate>(
  "WorkUpdate",
  workUpdateSchema
);
