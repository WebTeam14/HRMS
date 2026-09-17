import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const updateAttendanceSchema = z
  .object({
    checkIn: z.coerce.date().optional(),
    checkOut: z.coerce.date().optional().nullable(),
    status: z
      .enum([
        "PRESENT",
        "ABSENT",
        "LATE",
        "HALF_DAY",
        "ON_LEAVE",
        "WEEK_OFF",
        "HOLIDAY",
      ])
      .optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  employeeId: objectId.optional().or(z.literal("")),
  departmentId: objectId.optional().or(z.literal("")),
  status: z
    .enum([
      "PRESENT",
      "ABSENT",
      "LATE",
      "HALF_DAY",
      "ON_LEAVE",
      "WEEK_OFF",
      "HOLIDAY",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["date", "createdAt", "status"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const attendanceHistoryQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z
    .enum([
      "PRESENT",
      "ABSENT",
      "LATE",
      "HALF_DAY",
      "ON_LEAVE",
      "WEEK_OFF",
      "HOLIDAY",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
