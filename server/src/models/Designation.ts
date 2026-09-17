import mongoose, { Document, Schema } from "mongoose";

export interface IDesignation extends Document {
  name: string;
  code?: string;
  departmentId?: mongoose.Types.ObjectId;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const designationSchema = new Schema<IDesignation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    description: {
      type: String,
      trim: true,
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

designationSchema.index({ departmentId: 1, name: 1 });
designationSchema.index({ name: 1 });
designationSchema.index({ isActive: 1 });

export const Designation = mongoose.model<IDesignation>(
  "Designation",
  designationSchema
);
