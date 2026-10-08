import api from "./api";
import type { ApiResponse, SalarySlip, SalarySummary } from "../types";

export const getMyPayslips = async (
  year = 2026
): Promise<ApiResponse<SalarySlip[]> & { summary?: SalarySummary }> => {
  const res = await api.get<ApiResponse<SalarySlip[]> & { summary?: SalarySummary }>(
    `/payroll/my-slips?year=${year}`
  );
  return res.data;
};

export const getPayslipById = async (
  id: string
): Promise<ApiResponse<SalarySlip>> => {
  const res = await api.get<ApiResponse<SalarySlip>>(`/payroll/my-slips/${id}`);
  return res.data;
};

export const getCompanyPayrollOverview = async (): Promise<
  ApiResponse<{
    totalMonthlyGross: number;
    totalMonthlyNet: number;
    totalMonthlyTds: number;
    totalMonthlyPf: number;
    activePayrollEmployees: number;
    latestMonth: string;
  }>
> => {
  const res = await api.get("/payroll/overview");
  return res.data;
};

export const getCompanyPayrollSheet = async (
  monthIndex: number,
  year = 2026
): Promise<ApiResponse<SalarySlip[]> & { summary?: SalarySummary }> => {
  const res = await api.get<ApiResponse<SalarySlip[]> & { summary?: SalarySummary }>(
    `/payroll/sheet?monthIndex=${monthIndex}&year=${year}`
  );
  return res.data;
};

export const calculateMonthlyPayroll = async (
  monthIndex: number,
  year = 2026
): Promise<ApiResponse<SalarySlip[]> & { summary?: SalarySummary }> => {
  const res = await api.post<ApiResponse<SalarySlip[]> & { summary?: SalarySummary }>(
    "/payroll/calculate",
    { monthIndex, year }
  );
  return res.data;
};

export const publishMonthlyPayroll = async (
  monthIndex: number,
  year = 2026
): Promise<ApiResponse<{ updatedCount: number }>> => {
  const res = await api.post<ApiResponse<{ updatedCount: number }>>(
    "/payroll/publish",
    { monthIndex, year }
  );
  return res.data;
};

export const updateSalarySlip = async (
  id: string,
  data: Partial<SalarySlip> & { basicSalary?: number; baseSalary?: number }
): Promise<ApiResponse<SalarySlip>> => {
  const res = await api.patch<ApiResponse<SalarySlip>>(`/payroll/slips/${id}`, data);
  return res.data;
};

export const recordPayment = async (
  id: string,
  data: {
    status?: string;
    paidVia?: string;
    paymentReference?: string;
    paymentDate?: string;
    paidProofUrl?: string;
    paidProofName?: string;
    notes?: string;
  }
): Promise<ApiResponse<SalarySlip>> => {
  const res = await api.patch<ApiResponse<SalarySlip>>(`/payroll/slips/${id}/payment`, data);
  return res.data;
};

export const raiseSalarySlipQuery = async (
  id: string,
  data: {
    queryType: string;
    subject: string;
    description: string;
  }
): Promise<ApiResponse<SalarySlip>> => {
  const res = await api.post<ApiResponse<SalarySlip>>(`/payroll/slips/${id}/queries`, data);
  return res.data;
};

export const updateSalarySlipQuery = async (
  id: string,
  queryId: string,
  data: {
    status: string;
    hrRemarks?: string;
  }
): Promise<ApiResponse<SalarySlip>> => {
  const res = await api.patch<ApiResponse<SalarySlip>>(
    `/payroll/slips/${id}/queries/${queryId}`,
    data
  );
  return res.data;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};
