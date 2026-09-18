import api from "./api";
import type {
  Attendance,
  AttendanceStatus,
  AttendanceSummary,
  PaginationMeta,
} from "../types";

export interface AttendanceFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  departmentId?: string;
  status?: AttendanceStatus | "";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AttendanceHistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus | "";
  page?: number;
  limit?: number;
}

export interface AttendanceListResponse {
  success: boolean;
  data: Attendance[];
  summary?: AttendanceSummary;
  meta: PaginationMeta;
}

export interface AttendanceResponse {
  success: boolean;
  data: Attendance | null;
  message?: string;
}

export const checkIn = async (): Promise<AttendanceResponse> => {
  const response = await api.post<AttendanceResponse>("/attendance/check-in");
  return response.data;
};

export const checkOut = async (): Promise<AttendanceResponse> => {
  const response = await api.post<AttendanceResponse>("/attendance/check-out");
  return response.data;
};

export const getTodayAttendance = async (): Promise<AttendanceResponse> => {
  const response = await api.get<AttendanceResponse>("/attendance/today");
  return response.data;
};

export const getMyAttendanceHistory = async (
  filters: AttendanceHistoryFilters = {}
): Promise<AttendanceListResponse> => {
  const response = await api.get<AttendanceListResponse>(
    "/attendance/my-history",
    { params: filters }
  );
  return response.data;
};

export const getAttendance = async (
  filters: AttendanceFilters = {}
): Promise<AttendanceListResponse> => {
  const response = await api.get<AttendanceListResponse>("/attendance", {
    params: filters,
  });
  return response.data;
};

export const getAttendanceById = async (
  id: string
): Promise<AttendanceResponse> => {
  const response = await api.get<AttendanceResponse>(`/attendance/${id}`);
  return response.data;
};

export const updateAttendance = async (
  id: string,
  data: {
    checkIn?: string;
    checkOut?: string | null;
    status?: AttendanceStatus;
    notes?: string;
  }
): Promise<AttendanceResponse> => {
  const response = await api.patch<AttendanceResponse>(
    `/attendance/${id}`,
    data
  );
  return response.data;
};

/**
 * Format minutes into readable format e.g. "8h 32m"
 */
export const formatWorkingHours = (
  totalMinutes?: number,
  isCheckedInWithoutCheckout?: boolean
): string => {
  if (isCheckedInWithoutCheckout) {
    return "Currently Working";
  }

  if (totalMinutes === undefined || totalMinutes === null || totalMinutes === 0) {
    return "—";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};

/**
 * Format ISO date string to readable IST time string e.g. "09:28 AM"
 */
export const formatTimeIST = (dateStr?: string): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format ISO date string to readable date e.g. "15 Sep 2026"
 */
export const formatDateShort = (dateStr?: string): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
