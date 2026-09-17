import mongoose, { Document, Schema } from "mongoose";

export type TicketCategory =
  | "HR"
  | "IT"
  | "PAYROLL"
  | "ADMIN"
  | "GENERAL";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface IHelpdeskTicket extends Document {
  ticketNumber: string;
  employeeId: mongoose.Types.ObjectId;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const helpdeskTicketSchema = new Schema<IHelpdeskTicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["HR", "IT", "PAYROLL", "ADMIN", "GENERAL"],
      default: "HR",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

helpdeskTicketSchema.index({ employeeId: 1, status: 1 });
helpdeskTicketSchema.index({ createdAt: -1 });

export const HelpdeskTicket = mongoose.model<IHelpdeskTicket>(
  "HelpdeskTicket",
  helpdeskTicketSchema
);
