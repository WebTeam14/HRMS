import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const initiateOnboardingSchema = z.object({
  notes: z.string().max(1000).optional(),
  templateTasks: z
    .array(
      z.object({
        title: z.string().min(1, "Task title is required"),
        assigneeRole: z.string().default("HR"),
        departmentId: objectId.optional(),
        dueDate: z.string().optional(),
      })
    )
    .optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED"]),
});

export const uploadDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  type: z.enum([
    "ID_PROOF",
    "EDUCATION",
    "BANK",
    "OFFER_LETTER",
    "EXPERIENCE",
    "OTHER",
  ]),
  fileUrl: z.string().min(1, "File URL or content is required"),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
});

export const verifyDocumentSchema = z.object({
  verificationStatus: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z.string().max(500).optional(),
});

export const onboardingQuerySchema = z.object({
  status: z.enum(["INVITED", "DOCS_PENDING", "VERIFIED", "ACTIVE"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
