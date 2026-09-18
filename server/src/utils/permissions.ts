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

  // Designation
  DESIGNATION_VIEW: "designation.view",
  DESIGNATION_CREATE: "designation.create",
  DESIGNATION_UPDATE: "designation.update",
  DESIGNATION_DELETE: "designation.delete",

  // Attendance
  ATTENDANCE_VIEW_SELF: "attendance.view_self",
  ATTENDANCE_CHECK_IN: "attendance.check_in",
  ATTENDANCE_CHECK_OUT: "attendance.check_out",
  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_UPDATE: "attendance.update",
  ATTENDANCE_MANAGE: "attendance.manage",

  // Leave
  LEAVE_VIEW_SELF: "leave.view_self",
  LEAVE_APPLY: "leave.apply",
  LEAVE_CANCEL: "leave.cancel",
  LEAVE_VIEW: "leave.view",
  LEAVE_APPROVE: "leave.approve",
  LEAVE_REJECT: "leave.reject",
  LEAVE_UPDATE: "leave.update",
  LEAVE_TYPE_VIEW: "leave_type.view",
  LEAVE_TYPE_CREATE: "leave_type.create",
  LEAVE_TYPE_UPDATE: "leave_type.update",
  LEAVE_BALANCE_VIEW: "leave_balance.view",
  LEAVE_BALANCE_UPDATE: "leave_balance.update",

  // Daily Work Updates & Tasks
  WORK_UPDATE_VIEW_SELF: "work_update.view_self",
  WORK_UPDATE_CREATE: "work_update.create",
  WORK_UPDATE_UPDATE: "work_update.update",
  WORK_UPDATE_DELETE: "work_update.delete",
  WORK_UPDATE_SUBMIT: "work_update.submit",
  WORK_UPDATE_VIEW: "work_update.view",
  WORK_UPDATE_APPROVE: "work_update.approve",
  WORK_UPDATE_REQUEST_CHANGES: "work_update.request_changes",
  WORK_TASK_CREATE: "work_task.create",
  WORK_TASK_UPDATE: "work_task.update",
  WORK_TASK_DELETE: "work_task.delete",

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

  