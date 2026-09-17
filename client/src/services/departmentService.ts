import api from "./api";
import type { Department, PaginationMeta } from "../types";

export type { Department };

export interface DepartmentFilters {
  search?: string;
  isActive?: boolean | string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DepartmentListResponse {
  success: boolean;
  data: Department[];
  meta: PaginationMeta;
}

export interface DepartmentResponse {
  success: boolean;
  data: Department;
  message?: string;
}

export const getDepartments = async (filters: DepartmentFilters = {}) => {
  const response = await api.get<DepartmentListResponse>("/departments", {
    params: filters,
  });
  return response.data;
};

export const getDepartment = async (id: string) => {
  const response = await api.get<DepartmentResponse>(`/departments/${id}`);
  return response.data;
};

export const createDepartment = async (data: {
  name: string;
  code: string;
  description?: string;
  managerId?: string;
}) => {
  const response = await api.post<DepartmentResponse>("/departments", data);
  return response.data;
};

export const updateDepartment = async (
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    managerId?: string;
    isActive?: boolean;
  }
) => {
  const response = await api.patch<DepartmentResponse>(
    `/departments/${id}`,
    data
  );
  return response.data;
};

export const updateDepartmentStatus = async (
  id: string,
  isActive: boolean
) => {
  const response = await api.patch<DepartmentResponse>(
    `/departments/${id}/status`,
    { isActive }
  );
  return response.data;
};
