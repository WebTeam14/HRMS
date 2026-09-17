import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const createDesignationSchema = z.object({
  name: z
    .string()
    .min(2, "Designation name must be at least 2 characters")
    .max(100, "Designation name cannot exceed 100 characters")
    .trim(),
  code: z
    .string()
    .max(20, "Designation code cannot exceed 20 characters")
    .toUpperCase()
    .trim()
    .optional()
    .or(z.literal("")),
  departmentId: objectId.optional().or(z.literal("")),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export const updateDesignationSchema = z
  .object({
    name: z
      .string()
      .min(2, "Designation name must be at least 2 characters")
      .max(100, "Designation name cannot exceed 100 characters")
      .trim()
      .optional(),
    code: z
      .string()
      .max(20, "Designation code cannot exceed 20 characters")
      .toUpperCase()
      .trim()
      .optional()
      .or(z.literal("")),
    departmentId: z
      .union([objectId, z.literal("")])
      .optional(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateDesignationStatusSchema = z.object({
  isActive: z.boolean(),
});

export const designationListQuerySchema = z.object({
  search: z.string().optional(),
  departmentId: objectId.optional().or(z.literal("")),
  isActive: z
    .enum(["true", "false"])
    .optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "active", "inactive", "all", "ALL", ""])
    .optional(),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10),
  sortBy: z
    .enum(["name", "code", "createdAt"])
    .default("name"),
  sortOrder: z
    .enum(["asc", "desc"])
    .default("asc"),
});
