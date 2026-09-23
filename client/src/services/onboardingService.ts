import api from "./api";
import type {
  OnboardingChecklist,
  OnboardingDocument,
  DocumentType,
  DocumentVerificationStatus,
} from "../types";

export interface OnboardingListResponse {
  success: boolean;
  data: OnboardingChecklist[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OnboardingDetailsResponse {
  success: boolean;
  data: {
    checklist: OnboardingChecklist;
    documents: OnboardingDocument[];
  };
}

export const listOnboardings = async (params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<OnboardingListResponse>("/onboarding", {
    params,
  });
  return response.data;
};

export const getOnboardingByEmployee = async (employeeId: string) => {
  const response = await api.get<OnboardingDetailsResponse>(
    `/onboarding/${employeeId}`
  );
  return response.data;
};

export const initiateOnboarding = async (
  employeeId: string,
  data?: {
    notes?: string;
    templateTasks?: Array<{
      title: string;
      assigneeRole?: string;
      departmentId?: string;
      dueDate?: string;
    }>;
  }
) => {
  const response = await api.post(`/onboarding/${employeeId}/initiate`, data || {});
  return response.data;
};

export const updateOnboardingTask = async (
  employeeId: string,
  taskId: string,
  status: "PENDING" | "COMPLETED"
) => {
  const response = await api.patch(
    `/onboarding/${employeeId}/tasks/${taskId}`,
    { status }
  );
  return response.data;
};

export const uploadOnboardingDocument = async (
  employeeId: string,
  data: {
    title: string;
    type: DocumentType;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
  }
) => {
  const response = await api.post(
    `/onboarding/${employeeId}/documents`,
    data
  );
  return response.data;
};

export const verifyOnboardingDocument = async (
  docId: string,
  verificationStatus: DocumentVerificationStatus,
  rejectionReason?: string
) => {
  const response = await api.patch(
    `/onboarding/documents/${docId}/verify`,
    {
      verificationStatus,
      rejectionReason,
    }
  );
  return response.data;
};
