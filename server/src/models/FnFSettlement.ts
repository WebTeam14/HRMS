import mongoose, { Document, Schema } from "mongoose";

export interface IFnFEarnings {
  basic: number;
  hra: number;
  leaveEncashment: number;
  bonus: number;
  gratuity: number;
  otherEarnings: number;
  totalEarnings: number;
}

export interface IFnFDeductions {
  noticePayDeduction: number;
  assetDamage: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
}

export interface IFnFSettlement extends Document {
  relievingId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  earnings: IFnFEarnings;
  deductions: IFnFDeductions;
  netPayable: number;
  remarks?: string;
  settledBy?: mongoose.Types.ObjectId;
  settledAt?: Date;
  status: "DRAFT" | "SETTLED";
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fnfSettlementSchema = new Schema<IFnFSettlement>(
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
    earnings: {
      basic: { type: Number, default: 0, min: 0 },
      hra: { type: Number, default: 0, min: 0 },
      leaveEncashment: { type: Number, default: 0, min: 0 },
      bonus: { type: Number, default: 0, min: 0 },
      gratuity: { type: Number, default: 0, min: 0 },
      otherEarnings: { type: Number, default: 0, min: 0 },
      totalEarnings: { type: Number, default: 0 },
    },
    deductions: {
      noticePayDeduction: { type: Number, default: 0, min: 0 },
      assetDamage: { type: Number, default: 0, min: 0 },
      pfDeduction: { type: Number, default: 0, min: 0 },
      taxDeduction: { type: Number, default: 0, min: 0 },
      otherDeductions: { type: Number, default: 0, min: 0 },
      totalDeductions: { type: Number, default: 0 },
    },
    netPayable: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    settledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    settledAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["DRAFT", "SETTLED"],
      default: "SETTLED",
    },
    pdfUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

fnfSettlementSchema.index({ employeeId: 1 });

export const FnFSettlement = mongoose.model<IFnFSettlement>(
  "FnFSettlement",
  fnfSettlementSchema
);
