import mongoose, { Document, Schema } from "mongoose";

export type DocumentType =
  | "ID_PROOF"
  | "EDUCATION"
  | "BANK"
  | "OFFER_LETTER"
  | "EXPERIENCE"
  | "OTHER";

export type DocumentVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface IOnboardingDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  onboardingId?: mongoose.Types.ObjectId;
  title: string;
  type: DocumentType;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  verificationStatus: DocumentVerificationStatus;
  rejectionReason?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const onboardingDocumentSchema = new Schema<IOnboardingDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    onboardingId: {
      type: Schema.Types.ObjectId,
      ref: "OnboardingChecklist",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["ID_PROOF", "EDUCATION", "BANK", "OFFER_LETTER", "EXPERIENCE", "OTHER"],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
      required: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

onboardingDocumentSchema.index({ employeeId: 1 });
onboardingDocumentSchema.index({ verificationStatus: 1 });
onboardingDocumentSchema.index({ type: 1 });

export const OnboardingDocument = mongoose.model<IOnboardingDocument>(
  "OnboardingDocument",
  onboardingDocumentSchema
);
