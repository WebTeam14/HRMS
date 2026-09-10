export const PERMISSIONS = {
  // Employee
  EMPLOYEE_VIEW: "employee.view",
  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_DELETE: "employee.delete",

  // Department
  DEPARTMENT_VIEW: "department.view",
  DEPARTMENT_CREATE: "department.create",
  DEPARTMENT_UPDATE: "department.update",
  DEPARTMENT_DELETE: "department.delete",

  // Attendance
  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_MANAGE: "attendance.manage",

  // Leave
  LEAVE_VIEW: "leave.view",
  LEAVE_APPROVE: "leave.approve",

  // Tasks
  TASK_VIEW: "task.view",
  TASK_CREATE: "task.create",
  TASK_UPDATE: "task.update",

  // Payroll
  PAYROLL_VIEW: "payroll.view",
  PAYROLL_MANAGE: "payroll.manage",

  // Reports
  REPORT_VIEW: "reports.view",

  // Settings
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

  