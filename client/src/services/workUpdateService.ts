import api from "./api";
import type {
  ApiResponse,
  WorkTask,
  WorkTaskPriority,
  WorkTaskStatus,
  WorkUpdate,
  WorkUpdateStatus,
  WorkUpdateSummary,
} from "../types";

// ==========================================
// EMPLOYEE WORK UPDATES
// ==========================================

export const createWorkUpdate = async (data: {
  date: string;
  summary: string;
  accomplishments?: string;
  blockers?: string;
  nextDayPlan?: string;
  totalHours?: number;
  status?: WorkUpdateStatus;
  tasks?: Array<{
    title: string;
    description?: string;
    status?: WorkTaskStatus;
    priority?: WorkTaskPriority;
    estimatedHours?: number;
    actualHours?: number;
  }>;
}): Promise<ApiResponse<WorkUpdate>> => {
  const response = await api.post<ApiResponse<WorkUpdate>>(
    "/work-updates",
    data
  );
  return response.data;
};

export const getMyWorkUpdates = async (params?: {
  month?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<WorkUpdate[]>> => {
  const response = await api.get<ApiResponse<WorkUpdate[]>>(
    "/work-updates/my",
    {
      params,
    }
  );
  return response.data;
};

export const getMyWorkUpdate = async (
  id: string
): Promise<ApiResponse<WorkUpdate>> => {
  const response = await api.get<ApiResponse<WorkUpdate>>(
    `/work-updates/${id}`
  );
  return response.data;
};

export const updateWorkUpdate = async (
  id: string,
  data: {
    summary?: string;
    accomplishments?: string;
    blockers?: string;
    nextDayPlan?: string;
    totalHours?: number;
    date?: string;
  }
): Promise<ApiResponse<WorkUpdate>> => {
  const response = await api.patch<ApiResponse<WorkUpdate>>(
    `/work-updates/${id}`,
    data
  );
  return response.data;
};

export const submitWorkUpdate = async (
  id: string
): Promise<ApiResponse<WorkUpdate>> => {
  const response = await api.post<ApiResponse<WorkUpdate>>(
    `/work-updates/${id}/submit`
  );
  return response.data;
};

export const deleteDraftWorkUpdate = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const response = await api.delete<ApiResponse<{ success: boolean }>>(
    `/work-updates/${id}`
  );
  return response.data;
};

// ==========================================
// MANAGEMENT WORK UPDATES
// ==========================================

export const getAllWorkUpdates = async (params?: {
  date?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<ApiResponse<WorkUpdate[]> & { summary?: WorkUpdateSummary }> => {
  const response = await api.get<
    ApiResponse<WorkUpdate[]> & { summary?: WorkUpdateSummary }
  >("/work-updates", {
    params,
  });
  return response.data;
};

export const getWorkUpdateById = async (
  id: string
): Promise<ApiResponse<WorkUpdate>> => {
  const response = await api.get<ApiResponse<WorkUpdate>>(
    `/work-updates/${id}`
  );
  return response.data;
};

export const approveWorkUpdate = async (
  id: string
): Promise<ApiResponse<WorkUpdate>> => {
  const response = await api.post<ApiResponse<WorkUpdate>>(
    `/work-updates/${id}/approve`
  );
  return response.data;
};

export const requestChangesOnWorkUpdate = async (
  id: string,
  managerComment: string
): Promise<ApiResponse<WorkUpdate>> => {
  const response = await api.post<ApiResponse<WorkUpdate>>(
    `/work-updates/${id}/request-changes`,
    { managerComment }
  );
  return response.data;
};

// ==========================================
// WORK TASKS
// ==========================================

export const createTask = async (
  workUpdateId: string,
  data: {
    title: string;
    description?: string;
    status?: WorkTaskStatus;
    priority?: WorkTaskPriority;
    estimatedHours?: number;
    actualHours?: number;
  }
): Promise<ApiResponse<WorkTask>> => {
  const response = await api.post<ApiResponse<WorkTask>>(
    `/work-updates/${workUpdateId}/tasks`,
    data
  );
  return response.data;
};

export const updateTask = async (
  workUpdateId: string,
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: WorkTaskStatus;
    priority?: WorkTaskPriority;
    estimatedHours?: number;
    actualHours?: number;
  }
): Promise<ApiResponse<WorkTask>> => {
  const response = await api.patch<ApiResponse<WorkTask>>(
    `/work-updates/${workUpdateId}/tasks/${taskId}`,
    data
  );
  return response.data;
};

export const deleteTask = async (
  workUpdateId: string,
  taskId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const response = await api.delete<ApiResponse<{ success: boolean }>>(
    `/work-updates/${workUpdateId}/tasks/${taskId}`
  );
  return response.data;
};

export const getTasks = async (
  workUpdateId: string
): Promise<ApiResponse<WorkTask[]>> => {
  const response = await api.get<ApiResponse<WorkTask[]>>(
    `/work-updates/${workUpdateId}/tasks`
  );
  return response.data;
};

// ==========================================
// HELPERS
// ==========================================

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

export const formatHoursDisplay = (hours?: number): string => {
  if (hours === undefined || hours === null || isNaN(hours)) return "0h";
  return `${hours}h`;
};
