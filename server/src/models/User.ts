import mongoose, { Document, Schema } from "mongoose";
import { Role } from "../utils/roles";

export interface IUser extends Document {
  email: string;

  passwordHash: string;

  role: Role;

  isActive: boolean;

  lastLoginAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      required: true,
      enum: [
        "EMPLOYEE",
        "MANAGER",
        "HR",
        "ACCOUNTS",
        "ADMIN",
        "CEO",
      ],
      default: "EMPLOYEE",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>(
  "User",
  userSchema
);
