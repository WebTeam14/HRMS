import api from "./api";

export interface Employee {
  _id: string;
  employeeCode: string;

  firstName: string;
  lastName?: string;

  phone?: string;
  dateOfBirth?: string;

  gender?: "MALE" | "FEMALE" | "OTHER";

  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };

  managerId?: {
    _id: string;
    employeeCode: string;
    firstName: string;
    lastName?: string;
    designation?: string;
  };

  designation?: string;

  joiningDate: string;

  employmentType:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN";

  workLocation?: string;
  monthlySalary?: number;

  status:
    | "ACTIVE"
    | "ON_LEAVE"
    | "NOTICE_PERIOD"
    | "INACTIVE";

  userId?: {
    _id: string;
    email: string;
    role: string;
    isActive: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: string;
  employmentType?: string;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface EmployeeListResponse {
  success: boolean;

  data: Employee[];

  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getEmployees = async (
  filters: EmployeeFilters = {}
) => {
  const response =
    await api.get<EmployeeListResponse>(
      "/employees",
      {
        params: filters,
      }
    );

  return response.data;
};

export const getEmployee = async (
  id: string
) => {
  const response =
    await api.get<{
      success: boolean;
      data: Employee;
    }>(`/employees/${id}`);

  return response.data;
};

export const createEmployee = async (
  data: Record<string, unknown>
) => {
  const response =
    await api.post(
      "/employees",
      data
    );

  return response.data;
};

export const updateEmployee = async (
  id: string,
  data: Record<string, unknown>
) => {
  const response =
    await api.patch(
      `/employees/${id}`,
      data
    );

  return response.data;
};

export const updateEmployeeStatus =
  async (
    id: string,
    status: Employee["status"]
  ) => {
    const response =
      await api.patch(
        `/employees/${id}/status`,
        { status }
      );

    return response.data;
  };