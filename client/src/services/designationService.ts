import api from "./api";
import type { Designation, PaginationMeta } from "../types";

export type { Designation };

export interface DesignationFilters {
  search?: string;
  departmentId?: string;
  isActive?: boolean | string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DesignationListResponse {
  success: boolean;
  data: Designation[];
  meta: PaginationMeta;
}

export interface DesignationResponse {
  success: boolean;
  data: Designation;
  message?: string;
}

export const getDesignations = async (filters: DesignationFilters = {}) => {
  const response = await api.get<DesignationListResponse>("/designations", {
    params: filters,
  });
  return response.data;
};

export const getDesignation = async (id: string) => {
  const response = await api.get<DesignationResponse>(`/designations/${id}`);
  return response.data;
};

export const createDesignation = async (data: {
  name: string;
  code?: string;
  departmentId?: string;
  description?: string;
}) => {
  const response = await api.post<DesignationResponse>("/designations", data);
  return response.data;
};

export const updateDesignation = async (
  id: string,
  data: {
    name?: string;
    code?: string;
    departmentId?: string;
    description?: string;
    isActive?: boolean;
  }
) => {
  const response = await api.patch<DesignationResponse>(
    `/designations/${id}`,
    data
  );
  return response.data;
};

export const updateDesignationStatus = async (
  id: string,
  isActive: boolean
) => {
  const response = await api.patch<DesignationResponse>(
    `/designations/${id}/status`,
    { isActive }
  );
  return response.data;
};
