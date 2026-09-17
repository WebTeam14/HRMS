import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Department name cannot exceed 100 characters")
    .trim(),
  code: z
    .string()
    .min(2, "Department code must be at least 2 characters")
    .max(20, "Department code cannot exceed 20 characters")
    .toUpperCase()
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  managerId: objectId.optional().or(z.literal("")),
});

export const updateDepartmentSchema = z
  .object({
    name: z
      .string()
      .min(2, "Department name must be at least 2 characters")
      .max(100, "Department name cannot exceed 100 characters")
      .trim()
      .optional(),
    code: z
      .string()
      .min(2, "Department code must be at least 2 characters")
      .max(20, "Department code cannot exceed 20 characters")
      .toUpperCase()
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    managerId: z
      .union([objectId, z.literal("")])
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateDepartmentStatusSchema = z.object({
  isActive: z.boolean(),
});

export const departmentListQuerySchema = z.object({
  search: z.string().optional(),
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
