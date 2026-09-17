import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import * as helpdeskService from "../services/helpdeskService";

export const getMyTickets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { status, category } = req.query as any;
    const result = await helpdeskService.getMyTickets(userId, { status, category });

    res.status(200).json({
      success: true,
      data: result.tickets,
      stats: result.stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch helpdesk tickets",
    });
  }
};

export const createTicket = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { category, subject, description, priority } = req.body;
    if (!subject || !description) {
      res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
      return;
    }

    const ticket = await helpdeskService.createTicket(userId, {
      category,
      subject,
      description,
      priority,
    });

    res.status(201).json({
      success: true,
      message: "Helpdesk ticket submitted successfully",
      data: ticket,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create helpdesk ticket",
    });
  }
};

export const getAllTickets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, category, priority } = req.query as any;
    const tickets = await helpdeskService.getAllTickets({ status, category, priority });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch all tickets",
    });
  }
};

export const resolveTicket = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { resolutionNotes } = req.body;

    const ticket = await helpdeskService.resolveTicket(id, resolutionNotes || "Resolved by support team");

    res.status(200).json({
      success: true,
      message: "Ticket resolved successfully",
      data: ticket,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to resolve ticket",
    });
  }
};
