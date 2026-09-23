import mongoose, { Document, Schema } from "mongoose";

export type RelievingStatus =
  | "INITIATED"
  | "APPROVED"
  | "CLEARANCE_PENDING"
  | "SETTLED"
  | "RELIEVED";

export interface IRelievingRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  resignationDate: Date;
  lastWorkingDay: Date;
  reason: string;
  handoverNotes?: string;
  personalEmail?: string;
  contactPhone?: string;
  status: RelievingStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approvalRemarks?: string;
  relievedAt?: Date;
  relievingLetterUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const relievingRequestSchema = new Schema<IRelievingRequest>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    resignationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastWorkingDay: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    handoverNotes: {
      type: String,
      trim: true,
    },
    personalEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["INITIATED", "APPROVED", "CLEARANCE_PENDING", "SETTLED", "RELIEVED"],
      default: "INITIATED",
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    approvalRemarks: {
      type: String,
      trim: true,
    },
    relievedAt: {
      type: Date,
    },
    relievingLetterUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

relievingRequestSchema.index({ employeeId: 1 });
relievingRequestSchema.index({ status: 1 });

export const RelievingRequest = mongoose.model<IRelievingRequest>(
  "RelievingRequest",
  relievingRequestSchema
);
