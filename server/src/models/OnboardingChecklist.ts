import mongoose, { Document, Schema } from "mongoose";

export type OnboardingStatus = "INVITED" | "DOCS_PENDING" | "VERIFIED" | "ACTIVE";
export type OnboardingTaskStatus = "PENDING" | "COMPLETED";

export interface IOnboardingTask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  assigneeRole: string;
  departmentId?: mongoose.Types.ObjectId;
  status: OnboardingTaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
}

export interface IOnboardingChecklist extends Document {
  employeeId: mongoose.Types.ObjectId;
  status: OnboardingStatus;
  tasks: IOnboardingTask[];
  notes?: string;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const onboardingTaskSchema = new Schema<IOnboardingTask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    assigneeRole: {
      type: String,
      default: "HR",
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
      required: true,
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: true }
);

const onboardingChecklistSchema = new Schema<IOnboardingChecklist>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["INVITED", "DOCS_PENDING", "VERIFIED", "ACTIVE"],
      default: "INVITED",
      required: true,
    },
    tasks: [onboardingTaskSchema],
    notes: {
      type: String,
      trim: true,
    },
    activatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

onboardingChecklistSchema.index({ status: 1 });

export const OnboardingChecklist = mongoose.model<IOnboardingChecklist>(
  "OnboardingChecklist",
  onboardingChecklistSchema
);
