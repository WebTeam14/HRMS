import api from "./api";
import type {
  ApiResponse,
  LeaveBalance,
  LeaveRequest,
  LeaveSummary,
  LeaveType,
} from "../types";

// ==========================================
// LEAVE TYPES
// ==========================================

export const getLeaveTypes = async (
  activeOnly: boolean = false
): Promise<ApiResponse<LeaveType[]>> => {
  const response = await api.get<ApiResponse<LeaveType[]>>("/leave-types", {
    params: activeOnly ? { active: "true" } : {},
  });
  return response.data;
};

export const getLeaveTypeById = async (
  id: string
): Promise<ApiResponse<LeaveType>> => {
  const response = await api.get<ApiResponse<LeaveType>>(`/leave-types/${id}`);
  return response.data;
};

export const createLeaveType = async (data: {
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  isPaid?: boolean;
  requiresApproval?: boolean;
  isActive?: boolean;
}): Promise<ApiResponse<LeaveType>> => {
  const response = await api.post<ApiResponse<LeaveType>>("/leave-types", data);
  return response.data;
};

export const updateLeaveType = async (
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    defaultDays?: number;
    isPaid?: boolean;
    requiresApproval?: boolean;
    isActive?: boolean;
  }
): Promise<ApiResponse<LeaveType>> => {
  const response = await api.patch<ApiResponse<LeaveType>>(
    `/leave-types/${id}`,
    data
  );
  return response.data;
};

export const updateLeaveTypeStatus = async (
  id: string,
  isActive: boolean
): Promise<ApiResponse<LeaveType>> => {
  const response = await api.patch<ApiResponse<LeaveType>>(
    `/leave-types/${id}/status`,
    { isActive }
  );
  return response.data;
};

// ==========================================
// LEAVE BALANCES
// ==========================================

export const getMyLeaveBalances = async (
  year?: number
): Promise<ApiResponse<LeaveBalance[]>> => {
  const response = await api.get<ApiResponse<LeaveBalance[]>>(
    "/leave/balances/me",
    {
      params: year ? { year } : {},
    }
  );
  return response.data;
};

export const getEmployeeLeaveBalances = async (
  employeeId: string,
  year?: number
): Promise<ApiResponse<LeaveBalance[]>> => {
  const response = await api.get<ApiResponse<LeaveBalance[]>>(
    `/leave/balances/${employeeId}`,
    {
      params: year ? { year } : {},
    }
  );
  return response.data;
};

// ==========================================
// EMPLOYEE LEAVE REQUESTS
// ==========================================

export const getMyLeaveRequests = async (params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<LeaveRequest[]>> => {
  const response = await api.get<ApiResponse<LeaveRequest[]>>("/leave/my", {
    params,
  });
  return response.data;
};

export const applyLeave = async (data: {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.post<ApiResponse<LeaveRequest>>("/leave", data);
  return response.data;
};

export const getLeaveRequest = async (
  id: string
): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.get<ApiResponse<LeaveRequest>>(`/leave/${id}`);
  return response.data;
};

export const cancelLeaveRequest = async (
  id: string
): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.patch<ApiResponse<LeaveRequest>>(
    `/leave/${id}/cancel`
  );
  return response.data;
};

// ==========================================
// HR / MANAGEMENT REQUESTS & APPROVALS
// ==========================================

export const getAllLeaveRequests = async (params?: {
  status?: string;
  employeeId?: string;
  departmentId?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<ApiResponse<LeaveRequest[]> & { summary?: LeaveSummary }> => {
  const response = await api.get<
    ApiResponse<LeaveRequest[]> & { summary?: LeaveSummary }
  >("/leave/requests", {
    params,
  });
  return response.data;
};

export const approveLeave = async (
  id: string
): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.patch<ApiResponse<LeaveRequest>>(
    `/leave/requests/${id}/approve`
  );
  return response.data;
};

export const rejectLeave = async (
  id: string,
  rejectionReason: string
): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.patch<ApiResponse<LeaveRequest>>(
    `/leave/requests/${id}/reject`,
    { rejectionReason }
  );
  return response.data;
};

// ==========================================
// FORMATTING HELPERS
// ==========================================

export const calculateCalendarDays = (
  startDate: string,
  endDate: string
): number => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

export const formatDateDisplay = (dateString?: string): string => {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};
