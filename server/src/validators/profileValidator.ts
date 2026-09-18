import { z } from "zod";

export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters")
      .trim()
      .optional(),
    lastName: z
      .string()
      .max(50, "Last name cannot exceed 50 characters")
      .trim()
      .optional(),
    phone: z
      .string()
      .max(20, "Phone number cannot exceed 20 characters")
      .trim()
      .optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100, "New password cannot exceed 100 characters"),
  })
  .strict();
