import { Request } from "express";
import { Role } from "../utils/roles";

export interface AuthenticatedUser {
  userId: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
} 