export type Role =
  | "EMPLOYEE"
  | "MANAGER"
  | "HR"
  | "ACCOUNTS"
  | "ADMIN"
  | "CEO";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  managerId?: {
    _id: string;
    employeeCode: string;
    firstName: string;
    lastName?: string;
    designation?: string;
    phone?: string;
  };
  employeeCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Designation {
  _id: string;
  name: string;
  code?: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
    description?: string;
  };
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;

  userId:
    | string
    | {
        _id: string;
        email: string;
        role: Role;
        isActive: boolean;
      };

  employeeCode: string;

  firstName: string;
  lastName?: string;

  phone?: string;
  dateOfBirth?: string;

  gender?: "MALE" | "FEMALE" | "OTHER";

  departmentId?:
    | string
    | {
        _id: string;
        name: string;
        code: string;
        description?: string;
      };

  managerId?:
    | string
    | {
        _id: string;
        employeeCode: string;
        firstName: string;
        lastName?: string;
        designation?: string;
      };

  designation?: string;

  joiningDate: string;

  employmentType:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN";

  workLocation?: string;
  monthlySalary?: number;

  status:
    | "ACTIVE"
    | "ON_LEAVE"
    | "NOTICE_PERIOD"
    | "INACTIVE";

  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "WEEK_OFF"
  | "HOLIDAY";

export type CheckInSource = "WEB" | "SYSTEM" | "ADMIN";

export interface Attendance {
  _id: string;
  employeeId:
    | string
    | {
        _id: string;
        employeeCode: string;
        firstName: string;
        lastName?: string;
        designation?: string;
        departmentId?: {
          _id: string;
          name: string;
          code: string;
        };
        phone?: string;
      };
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalWorkingMinutes: number;
  status: AttendanceStatus;
  checkInSource: CheckInSource;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  halfDay: number;
  totalActive: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveType {
  _id: string;
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  _id: string;
  employeeId: string;
  leaveTypeId: LeaveType;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  _id: string;
  employeeId:
    | string
    | {
        _id: string;
        employeeCode: string;
        firstName: string;
        lastName?: string;
        designation?: string;
        departmentId?: {
          _id: string;
          name: string;
          code: string;
        };
      };
  leaveTypeId: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: {
    _id: string;
    email: string;
    role: Role;
  };
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveSummary {
  pending: number;
  approved: number;
  rejected: number;
  onLeaveToday: number;
}

export type WorkUpdateStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type WorkTaskStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING";
export type WorkTaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface WorkTask {
  _id: string;
  workUpdateId: string;
  employeeId: string;
  title: string;
  description?: string;
  status: WorkTaskStatus;
  priority: WorkTaskPriority;
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkUpdate {
  _id: string;
  employeeId:
    | string
    | {
        _id: string;
        employeeCode: string;
        firstName: string;
        lastName?: string;
        designation?: string;
        departmentId?: {
          _id: string;
          name: string;
          code: string;
        };
      };
  date: string;
  summary: string;
  accomplishments?: string;
  blockers?: string;
  nextDayPlan?: string;
  totalHours: number;
  status: WorkUpdateStatus;
  reviewedBy?: {
    _id: string;
    email: string;
    role: Role;
  };
  reviewedAt?: string;
  managerComment?: string;
  taskCount?: number;
  completedTaskCount?: number;
  tasks?: WorkTask[];
  attendance?: any;
  createdAt: string;
  updatedAt: string;
}

export interface WorkUpdateSummary {
  pending: number;
  approved: number;
  changesRequested: number;
  totalHours: number;
  tasksCompleted: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  summary?: any;
  nextHoliday?: Holiday | null;
  monthlyStats?: {
    totalUpdates: number;
    totalHours: number;
    tasksCompleted: number;
  };
  stats?: any;
}

export type HolidayType = "MANDATORY" | "OPTIONAL";

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  day: string;
  type: HolidayType;
  description?: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalarySlip {
  _id: string;
  employeeId:
    | string
    | {
        _id: string;
        employeeCode: string;
        firstName: string;
        lastName?: string;
        designation?: string;
        departmentId?: {
          name: string;
          code: string;
        };
        managerId?: {
          employeeCode: string;
          firstName: string;
          lastName?: string;
        };
        userId?: {
          email: string;
          role: Role;
        };
      };
  month: string;
  monthIndex: number;
  year: number;

  // Attendance & Days Breakdown
  totalDaysInMonth: number;
  presentDays: number;
  paidLeaveDays: number;
  holidaysCount: number;
  lateMarksCount: number;
  lopDays: number;
  payableDays: number;

  // Earnings
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  incentives?: number;
  reimbursements?: number;
  grossSalary: number;

  // Deductions
  lopDeduction: number;
  pfDeduction: number;
  taxDeduction: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;

  // Net Pay
  netSalary: number;

  // Metadata
  status: "PAID" | "PROCESSED" | "DRAFT" | "PENDING";
  paymentDate?: string;
  bankAccountLast4?: string;
  panNumber?: string;
  uanNumber?: string;
  pfNumber?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface SalarySummary {
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  totalTax: number;
  totalPf: number;
  totalLopDays?: number;
  totalEmployees?: number;
}

export type TicketCategory = "HR" | "IT" | "PAYROLL" | "ADMIN" | "GENERAL";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface HelpdeskTicket {
  _id: string;
  ticketNumber: string;
  employeeId:
    | string
    | {
        _id: string;
        employeeCode: string;
        firstName: string;
        lastName?: string;
        designation?: string;
        departmentId?: {
          name: string;
          code: string;
        };
      };
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}