import { z } from "zod";

export const initiateRelievingSchema = z.object({
  lastWorkingDay: z.string().min(1, "Last working day is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(2000),
  handoverNotes: z.string().max(2000).optional(),
  personalEmail: z.string().email("Valid personal email is required").optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional(),
});

export const approveRelievingSchema = z.object({
  approvalRemarks: z.string().max(1000).optional(),
});

export const updateClearanceItemSchema = z.object({
  status: z.enum(["PENDING", "CLEARED", "FLAGGED"]),
  remarks: z.string().max(500).optional(),
});

export const fnfSettlementSchema = z.object({
  earnings: z.object({
    basic: z.coerce.number().min(0).default(0),
    hra: z.coerce.number().min(0).default(0),
    leaveEncashment: z.coerce.number().min(0).default(0),
    bonus: z.coerce.number().min(0).default(0),
    gratuity: z.coerce.number().min(0).default(0),
    otherEarnings: z.coerce.number().min(0).default(0),
  }),
  deductions: z.object({
    noticePayDeduction: z.coerce.number().min(0).default(0),
    assetDamage: z.coerce.number().min(0).default(0),
    pfDeduction: z.coerce.number().min(0).default(0),
    taxDeduction: z.coerce.number().min(0).default(0),
    otherDeductions: z.coerce.number().min(0).default(0),
  }),
  remarks: z.string().max(1000).optional(),
});

export const relievingQuerySchema = z.object({
  status: z
    .enum(["INITIATED", "APPROVED", "CLEARANCE_PENDING", "SETTLED", "RELIEVED"])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
