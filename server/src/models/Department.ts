import mongoose, { Document, Schema } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;

  managerId?: mongoose.Types.ObjectId;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
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

    managerId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
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

export const Department = mongoose.model<IDepartment>(
  "Department",
  departmentSchema
);