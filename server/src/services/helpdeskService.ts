import { HelpdeskTicket, IHelpdeskTicket, TicketCategory, TicketPriority, TicketStatus } from "../models/HelpdeskTicket";
import { ensureEmployeeForUser } from "../utils/ensureEmployee";

export const getMyTickets = async (
  userId: string,
  query: { status?: TicketStatus; category?: TicketCategory }
): Promise<{
  tickets: IHelpdeskTicket[];
  stats: { open: number; inProgress: number; resolved: number };
}> => {
  const employee = await ensureEmployeeForUser(userId);

  const filter: any = { employeeId: employee._id };
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const tickets = await HelpdeskTicket.find(filter)
    .sort({ createdAt: -1 })
    .populate("employeeId", "employeeCode firstName lastName designation");

  const open = await HelpdeskTicket.countDocuments({
    employeeId: employee._id,
    status: "OPEN",
  });
  const inProgress = await HelpdeskTicket.countDocuments({
    employeeId: employee._id,
    status: "IN_PROGRESS",
  });
  const resolved = await HelpdeskTicket.countDocuments({
    employeeId: employee._id,
    status: { $in: ["RESOLVED", "CLOSED"] },
  });

  return {
    tickets,
    stats: { open, inProgress, resolved },
  };
};

export const createTicket = async (
  userId: string,
  data: {
    category: TicketCategory;
    subject: string;
    description: string;
    priority?: TicketPriority;
  }
): Promise<IHelpdeskTicket> => {
  const employee = await ensureEmployeeForUser(userId);

  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const ticketNumber = `REQ-${randomNum}`;

  const ticket = new HelpdeskTicket({
    ticketNumber,
    employeeId: employee._id,
    category: data.category || "HR",
    subject: data.subject.trim(),
    description: data.description.trim(),
    priority: data.priority || "MEDIUM",
    status: "OPEN",
  });

  await ticket.save();
  return ticket;
};

export const getAllTickets = async (query: {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
}): Promise<IHelpdeskTicket[]> => {
  const filter: any = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.priority) filter.priority = query.priority;

  return HelpdeskTicket.find(filter)
    .sort({ createdAt: -1 })
    .populate({
      path: "employeeId",
      populate: { path: "departmentId", select: "name code" },
    });
};

export const resolveTicket = async (
  id: string,
  resolutionNotes: string
): Promise<IHelpdeskTicket> => {
  const ticket = await HelpdeskTicket.findById(id);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  ticket.status = "RESOLVED";
  ticket.resolutionNotes = resolutionNotes.trim();
  ticket.resolvedAt = new Date();

  await ticket.save();
  return ticket;
};
