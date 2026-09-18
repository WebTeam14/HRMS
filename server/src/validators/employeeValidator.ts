
import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[a-f\d]{24}$/i,
    "Invalid MongoDB ObjectId"
  );

export const createEmployeeSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(
      8,
      "Password must be at least 8 characters"
    ),

  firstName: z
    .string()
    .min(
      2,
      "First name is required"
    )
    .max(50),

  lastName: z
    .string()
    .max(50)
    .optional(),

  phone: z
    .string()
    .max(20)
    .optional(),

  dateOfBirth: z
    .coerce
    .date()
    .optional(),

  gender: z
    .enum([
      "MALE",
      "FEMALE",
      "OTHER",
    ])
    .optional(),

  departmentId: objectId.optional(),

  managerId: objectId.optional(),

  designation: z
    .string()
    .max(100)
    .optional(),

  joiningDate: z
    .coerce
    .date(),

  employmentType: z
    .enum([
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "INTERN",
    ])
    .default("FULL_TIME"),

  workLocation: z
    .string()
    .max(100)
    .optional(),

  monthlySalary: z
    .coerce
    .number()
    .min(0)
    .optional(),
});

export const updateEmployeeSchema =
  z.object({
    firstName: z
      .string()
      .min(2)
      .max(50)
      .optional(),

    lastName: z
      .string()
      .max(50)
      .optional(),

    phone: z
      .string()
      .max(20)
      .optional(),

    dateOfBirth: z
      .coerce
      .date()
      .optional(),

    gender: z
      .enum([
        "MALE",
        "FEMALE",
        "OTHER",
      ])
      .optional(),

    departmentId: z
      .union([
        objectId,
        z.literal(""),
      ])
      .optional(),

    managerId: z
      .union([
        objectId,
        z.literal(""),
      ])
      .optional(),

    designation: z
      .string()
      .max(100)
      .optional(),

    joiningDate: z
      .coerce
      .date()
      .optional(),

    employmentType: z
      .enum([
        "FULL_TIME",
        "PART_TIME",
        "CONTRACT",
        "INTERN",
      ])
      .optional(),

    workLocation: z
      .string()
      .max(100)
      .optional(),

    monthlySalary: z
      .coerce
      .number()
      .min(0)
      .optional(),
  })
  .strict();

export const updateEmployeeStatusSchema =
  z.object({
    status: z.enum([
      "ACTIVE",
      "ON_LEAVE",
      "NOTICE_PERIOD",
      "INACTIVE",
    ]),
  });

export const employeeListQuerySchema =
  z.object({
    search: z
      .string()
      .optional(),

    departmentId: objectId.optional(),

    status: z
      .enum([
        "ACTIVE",
        "ON_LEAVE",
        "NOTICE_PERIOD",
        "INACTIVE",
      ])
      .optional(),

    employmentType: z
      .enum([
        "FULL_TIME",
        "PART_TIME",
        "CONTRACT",
        "INTERN",
      ])
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
      .enum([
        "createdAt",
        "joiningDate",
        "firstName",
        "employeeCode",
      ])
      .default("createdAt"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  });