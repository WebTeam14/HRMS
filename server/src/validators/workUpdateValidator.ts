import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const workTaskItemSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(1000).optional(),
  status: z
    .enum(["COMPLETED", "IN_PROGRESS", "PENDING"])
    .default("COMPLETED"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  estimatedHours: z.coerce.number().min(0, "Estimated hours cannot be negative").default(0),
  actualHours: z.coerce.number().min(0, "Actual hours cannot be negative").default(0),
});

export const createWorkUpdateSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    summary: z.string().min(3, "Summary must be at least 3 characters").max(2000),
    accomplishments: z.string().max(2000).optional(),
    blockers: z.string().max(2000).optional(),
    nextDayPlan: z.string().max(2000).optional(),
    totalHours: z.coerce.number().min(0).optional(),
    status: z.enum(["DRAFT", "SUBMITTED"]).optional().default("DRAFT"),
    tasks: z.array(workTaskItemSchema).optional(),
  })
  .strict();

export const updateWorkUpdateSchema = z
  .object({
    summary: z.string().min(3, "Summary must be at least 3 characters").max(2000).optional(),
    accomplishments: z.string().max(2000).optional(),
    blockers: z.string().max(2000).optional(),
    nextDayPlan: z.string().max(2000).optional(),
    totalHours: z.coerce.number().min(0).optional(),
    date: z.string().optional(),
  })
  .strict();

export const createTaskSchema = workTaskItemSchema.strict();

export const updateTaskSchema = workTaskItemSchema.partial().strict();

export const requestChangesSchema = z
  .object({
    managerComment: z
      .string()
      .min(3, "Manager comment must be at least 3 characters")
      .max(1000),
  })
  .strict();

export const workUpdateQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format (YYYY-MM)").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "CHANGES_REQUESTED"]).optional(),
  employeeId: objectId.optional().or(z.literal("")),
  departmentId: objectId.optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["date", "createdAt", "status"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
