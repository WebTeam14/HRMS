import api from "./api";
import type {
  ApiResponse,
  HelpdeskTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../types";

export interface TicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
}

export const getMyTickets = async (
  filters: TicketFilters = {}
): Promise<
  ApiResponse<HelpdeskTicket[]> & {
    stats?: { open: number; inProgress: number; resolved: number };
  }
> => {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.category) params.append("category", filters.category);

  const res = await api.get<
    ApiResponse<HelpdeskTicket[]> & {
      stats?: { open: number; inProgress: number; resolved: number };
    }
  >(`/helpdesk/my?${params.toString()}`);
  return res.data;
};

export const createTicket = async (data: {
  category: TicketCategory;
  subject: string;
  description: string;
  priority?: TicketPriority;
}): Promise<ApiResponse<HelpdeskTicket>> => {
  const res = await api.post<ApiResponse<HelpdeskTicket>>("/helpdesk", data);
  return res.data;
};

export const getAllTickets = async (
  filters: TicketFilters = {}
): Promise<ApiResponse<HelpdeskTicket[]>> => {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.category) params.append("category", filters.category);
  if (filters.priority) params.append("priority", filters.priority);

  const res = await api.get<ApiResponse<HelpdeskTicket[]>>(
    `/helpdesk/tickets?${params.toString()}`
  );
  return res.data;
};

export const resolveTicket = async (
  id: string,
  resolutionNotes: string
): Promise<ApiResponse<HelpdeskTicket>> => {
  const res = await api.patch<ApiResponse<HelpdeskTicket>>(
    `/helpdesk/tickets/${id}/resolve`,
    { resolutionNotes }
  );
  return res.data;
};
