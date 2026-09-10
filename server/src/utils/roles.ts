export const ROLES = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  HR: "HR",
  ACCOUNTS: "ACCOUNTS",
  ADMIN: "ADMIN",
  CEO: "CEO",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
