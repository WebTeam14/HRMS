import api from "./api";
import type { Employee } from "../types";

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "";
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  data: Employee;
  message?: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export const getMyProfile = async (): Promise<ProfileResponse> => {
  const response = await api.get<ProfileResponse>("/profile/me");
  return response.data;
};

export const updateMyProfile = async (
  data: UpdateProfileData
): Promise<ProfileResponse> => {
  const response = await api.patch<ProfileResponse>("/profile/me", data);
  return response.data;
};

export const changePassword = async (
  data: ChangePasswordData
): Promise<ChangePasswordResponse> => {
  const response = await api.patch<ChangePasswordResponse>(
    "/profile/change-password",
    data
  );
  return response.data;
};
