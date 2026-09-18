import api from "./api";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskEmployee {
  _id: string;
  firstName: string;
  lastName?: string;
  employeeCode: string;
  designation?: string;
  departmentId?: { _id: string; name: string };
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  estimatedHours: number;
  actualHours: number;
  completedAt?: string;
  employeeId: TaskEmployee;
  assignedById?: TaskEmployee;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  overdue: number;
  inProgress: number;
  todo: number;
}

export interface TaskAlerts {
  myOverdue: number;
  myPending: number;
  myDueToday: number;
  teamOverdue: number;
  teamPending: number;
}

// Create a new task (manager assigns)
export const createTask = (data: {
  title: string;
  description?: string;
  assigneeId: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
}) => api.post<{ success: boolean; data: Task }>("/tasks", data);

// Get my tasks (employee)
export const getMyTasks = (params?: { status?: TaskStatus; priority?: TaskPriority }) =>
  api.get<{ success: boolean; data: Task[]; stats: TaskStats }>("/tasks/my", { params });

// Get team tasks (manager)
export const getTeamTasks = (params?: {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}) => api.get<{ success: boolean; data: Task[]; stats: TaskStats }>("/tasks/team", { params });

// Update task status
export const updateTaskStatus = (id: string, status: TaskStatus, actualHours?: number) =>
  api.patch<{ success: boolean; data: Task }>(`/tasks/${id}/status`, { status, actualHours });

// Full edit task
export const updateTask = (
  id: string,
  data: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    estimatedHours?: number;
    assigneeId?: string;
  }
) => api.put<{ success: boolean; data: Task }>(`/tasks/${id}`, data);

// Delete task
export const deleteTask = (id: string) =>
  api.delete<{ success: boolean }>(`/tasks/${id}`);

// Get alert counts for dashboard
export const getTaskAlerts = () =>
  api.get<{ success: boolean; data: TaskAlerts }>("/tasks/alerts");

// Get all team members for assign dropdown
export const getTeamMembers = () =>
  api.get<{ success: boolean; data: TaskEmployee[] }>("/tasks/members");
