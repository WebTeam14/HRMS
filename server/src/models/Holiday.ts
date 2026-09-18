import mongoose, { Document, Schema } from "mongoose";

export type HolidayType = "MANDATORY" | "OPTIONAL";

export interface IHoliday extends Document {
  name: string;
  date: Date;
  day: string;
  type: HolidayType;
  description?: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<IHoliday>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["MANDATORY", "OPTIONAL"],
      default: "MANDATORY",
    },
    description: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

holidaySchema.index({ name: 1, date: 1 }, { unique: true });
holidaySchema.index({ date: 1 });
holidaySchema.index({ year: 1, date: 1 });

export const Holiday = mongoose.model<IHoliday>("Holiday", holidaySchema);
