import mongoose, { Document, Schema } from "mongoose";

export interface IEmployee extends Document {
  userId: mongoose.Types.ObjectId;

  employeeCode: string;

  firstName: string;
  lastName?: string;

  phone?: string;
  dateOfBirth?: Date;

  gender?: "MALE" | "FEMALE" | "OTHER";

  departmentId?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;

  designation?: string;

  joiningDate: Date;

  employmentType:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN";

  workLocation?: string;

  status:
    | "ACTIVE"
    | "ON_LEAVE"
    | "NOTICE_PERIOD"
    | "INACTIVE";

  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },

    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },

    managerId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },

    designation: {
      type: String,
      trim: true,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    employmentType: {
      type: String,
      enum: [
        "FULL_TIME",
        "PART_TIME",
        "CONTRACT",
        "INTERN",
      ],
      default: "FULL_TIME",
    },

    workLocation: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "ON_LEAVE",
        "NOTICE_PERIOD",
        "INACTIVE",
      ],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ departmentId: 1 });
employeeSchema.index({ managerId: 1 });
employeeSchema.index({ status: 1 });

export const Employee = mongoose.model<IEmployee>(
  "Employee",
  employeeSchema
);