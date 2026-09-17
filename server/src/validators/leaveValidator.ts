import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const applyLeaveSchema = z
  .object({
    leaveTypeId: objectId,
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().min(3, "Reason must be at least 3 characters").max(500),
  })
  .strict()
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: "End date cannot be earlier than start date",
      path: ["endDate"],
    }
  );

export const rejectLeaveSchema = z
  .object({
    rejectionReason: z
      .string()
      .min(3, "Rejection reason must be at least 3 characters")
      .max(500),
  })
  .strict();

export const leaveQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
    .optional(),
  employeeId: objectId.optional().or(z.literal("")),
  departmentId: objectId.optional().or(z.literal("")),
  leaveTypeId: objectId.optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["startDate", "createdAt", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const leaveTypeSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    code: z
      .string()
      .min(2, "Code must be at least 2 characters")
      .max(20)
      .toUpperCase(),
    description: z.string().max(200).optional(),
    defaultDays: z.coerce.number().min(0, "Default days cannot be negative"),
    isPaid: z.boolean().default(true),
    requiresApproval: z.boolean().default(true),
    isActive: z.boolean().default(true),
  })
  .strict();

export const updateLeaveTypeSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    code: z.string().min(2).max(20).toUpperCase().optional(),
    description: z.string().max(200).optional(),
    defaultDays: z.coerce.number().min(0).optional(),
    isPaid: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateLeaveTypeStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();
