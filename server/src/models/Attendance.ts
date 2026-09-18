import mongoose, { Document, Schema } from "mongoose";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "WEEK_OFF"
  | "HOLIDAY";

export type CheckInSource = "WEB" | "SYSTEM" | "ADMIN";

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  totalWorkingMinutes: number;
  status: AttendanceStatus;
  checkInSource: CheckInSource;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
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
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    totalWorkingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "PRESENT",
        "ABSENT",
        "LATE",
        "HALF_DAY",
        "ON_LEAVE",
        "WEEK_OFF",
        "HOLIDAY",
      ],
      default: "PRESENT",
      required: true,
    },
    checkInSource: {
      type: String,
      enum: ["WEB", "SYSTEM", "ADMIN"],
      default: "WEB",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: One attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ employeeId: 1, date: -1 });

export const Attendance = mongoose.model<IAttendance>(
  "Attendance",
  attendanceSchema
);
