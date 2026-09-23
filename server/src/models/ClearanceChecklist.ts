import mongoose, { Document, Schema } from "mongoose";

export type ClearanceItemStatus = "PENDING" | "CLEARED" | "FLAGGED";

export interface IClearanceItem {
  _id?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  departmentCode: string; // "IT", "HR", "ACCOUNTS", "ADMIN"
  item: string;
  status: ClearanceItemStatus;
  remarks?: string;
  clearedBy?: mongoose.Types.ObjectId;
  clearedAt?: Date;
}

export interface IClearanceChecklist extends Document {
  relievingId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  items: IClearanceItem[];
  allCleared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clearanceItemSchema = new Schema<IClearanceItem>(
  {
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    departmentCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    item: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "CLEARED", "FLAGGED"],
      default: "PENDING",
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    clearedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    clearedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const clearanceChecklistSchema = new Schema<IClearanceChecklist>(
  {
    relievingId: {
      type: Schema.Types.ObjectId,
      ref: "RelievingRequest",
      required: true,
      unique: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    items: [clearanceItemSchema],
    allCleared: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

clearanceChecklistSchema.index({ employeeId: 1 });

export const ClearanceChecklist = mongoose.model<IClearanceChecklist>(
  "ClearanceChecklist",
  clearanceChecklistSchema
);
