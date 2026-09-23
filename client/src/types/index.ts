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

// ==========================================
// ONBOARDING MODULE TYPES
// ==========================================
export type OnboardingStatus = "INVITED" | "DOCS_PENDING" | "VERIFIED" | "ACTIVE";
export type OnboardingTaskStatus = "PENDING" | "COMPLETED";

export interface OnboardingTask {
  _id: string;
  title: string;
  assigneeRole: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  status: OnboardingTaskStatus;
  dueDate?: string;
  completedAt?: string;
  completedBy?: {
    _id: string;
    email: string;
  };
}

export interface OnboardingChecklist {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName?: string;
    employeeCode: string;
    designation?: string;
    phone?: string;
    workLocation?: string;
    joiningDate: string;
    status: string;
    departmentId?: {
      _id: string;
      name: string;
      code: string;
    };
    userId?: {
      _id: string;
      email: string;
      role: Role;
      isActive: boolean;
    };
  };
  status: OnboardingStatus;
  tasks: OnboardingTask[];
  notes?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | "ID_PROOF"
  | "EDUCATION"
  | "BANK"
  | "OFFER_LETTER"
  | "EXPERIENCE"
  | "OTHER";

export type DocumentVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface OnboardingDocument {
  _id: string;
  employeeId: string;
  onboardingId?: string;
  title: string;
  type: DocumentType;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  verificationStatus: DocumentVerificationStatus;
  rejectionReason?: string;
  verifiedBy?: {
    _id: string;
    email: string;
  };
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// RELIEVING / EXIT MODULE TYPES
// ==========================================
export type RelievingStatus =
  | "INITIATED"
  | "APPROVED"
  | "CLEARANCE_PENDING"
  | "SETTLED"
  | "RELIEVED";

export interface RelievingRequest {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName?: string;
    employeeCode: string;
    designation?: string;
    phone?: string;
    workLocation?: string;
    joiningDate: string;
    monthlySalary?: number;
    status: string;
    departmentId?: {
      _id: string;
      name: string;
      code: string;
    };
    userId?: {
      _id: string;
      email: string;
      role: Role;
      isActive: boolean;
    };
  };
  resignationDate: string;
  lastWorkingDay: string;
  reason: string;
  handoverNotes?: string;
  personalEmail?: string;
  contactPhone?: string;
  status: RelievingStatus;
  approvedBy?: {
    _id: string;
    email: string;
  };
  approvedAt?: string;
  approvalRemarks?: string;
  relievedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClearanceItemStatus = "PENDING" | "CLEARED" | "FLAGGED";

export interface ClearanceItem {
  _id: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  departmentCode: string;
  item: string;
  status: ClearanceItemStatus;
  remarks?: string;
  clearedBy?: {
    _id: string;
    email: string;
  };
  clearedAt?: string;
}

export interface ClearanceChecklist {
  _id: string;
  relievingId: string;
  employeeId: string;
  items: ClearanceItem[];
  allCleared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FnFEarnings {
  basic: number;
  hra: number;
  leaveEncashment: number;
  bonus: number;
  gratuity: number;
  otherEarnings: number;
  totalEarnings: number;
}

export interface FnFDeductions {
  noticePayDeduction: number;
  assetDamage: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
}

export interface FnFSettlement {
  _id: string;
  relievingId: string;
  employeeId: string;
  earnings: FnFEarnings;
  deductions: FnFDeductions;
  netPayable: number;
  remarks?: string;
  settledBy?: {
    _id: string;
    email: string;
  };
  settledAt?: string;
  status: "DRAFT" | "SETTLED";
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelievingLetterData {
  referenceNumber: string;
  issueDate: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  joiningDate: string;
  relievingDate: string;
  companyName: string;
  authorizedSignatory: string;
}