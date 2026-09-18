import api from "./api";
import type { ApiResponse, Holiday, HolidayType } from "../types";

export interface HolidayFilters {
  year?: number;
  type?: HolidayType;
}

export const getHolidays = async (
  filters: HolidayFilters = {}
): Promise<ApiResponse<Holiday[]>> => {
  const params = new URLSearchParams();
  if (filters.year) params.append("year", filters.year.toString());
  if (filters.type) params.append("type", filters.type);

  const res = await api.get<ApiResponse<Holiday[]>>(
    `/holidays?${params.toString()}`
  );
  return res.data;
};

export const createHoliday = async (data: {
  name: string;
  date: string;
  type?: HolidayType;
  description?: string;
}): Promise<ApiResponse<Holiday>> => {
  const res = await api.post<ApiResponse<Holiday>>("/holidays", data);
  return res.data;
};

export const formatHolidayDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};
