import api from "./api";
import type {
  RelievingRequest,
  ClearanceChecklist,
  ClearanceItemStatus,
  FnFSettlement,
  FnFEarnings,
  FnFDeductions,
  RelievingLetterData,
} from "../types";

export interface RelievingListResponse {
  success: boolean;
  data: RelievingRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RelievingDetailsResponse {
  success: boolean;
  data: {
    request: RelievingRequest;
    clearance: ClearanceChecklist | null;
    settlement: FnFSettlement | null;
  };
}

export const listRelievingRequests = async (params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<RelievingListResponse>("/relieving", {
    params,
  });
  return response.data;
};

export const getRelievingDetails = async (id: string) => {
  const response = await api.get<RelievingDetailsResponse>(`/relieving/${id}`);
  return response.data;
};

export const getRelievingByEmployee = async (employeeId: string) => {
  const response = await api.get<RelievingDetailsResponse>(
    `/relieving/employee/${employeeId}`
  );
  return response.data;
};

export const initiateRelieving = async (
  employeeId: string,
  data: {
    lastWorkingDay: string;
    reason: string;
    handoverNotes?: string;
    personalEmail?: string;
    contactPhone?: string;
  }
) => {
  const response = await api.post(`/relieving/${employeeId}/initiate`, data);
  return response.data;
};

export const approveRelieving = async (
  id: string,
  approvalRemarks?: string
) => {
  const response = await api.patch(`/relieving/${id}/approve`, {
    approvalRemarks,
  });
  return response.data;
};

export const updateClearanceItem = async (
  id: string,
  itemId: string,
  status: ClearanceItemStatus,
  remarks?: string
) => {
  const response = await api.patch(`/relieving/${id}/clearance/${itemId}`, {
    status,
    remarks,
  });
  return response.data;
};

export const saveFnFSettlement = async (
  id: string,
  data: {
    earnings: FnFEarnings;
    deductions: FnFDeductions;
    remarks?: string;
  }
) => {
  const response = await api.post(`/relieving/${id}/settlement`, data);
  return response.data;
};

export const finalizeRelief = async (id: string) => {
  const response = await api.post(`/relieving/${id}/finalize`);
  return response.data;
};

export const getRelievingLetter = async (id: string) => {
  const response = await api.get<{
    success: boolean;
    data: RelievingLetterData;
  }>(`/relieving/${id}/relieving-letter`);
  return response.data;
};
