import { Response, NextFunction } from "express";

import { AuthenticatedRequest } from "../types/auth";
import { Role } from "../utils/roles";
import { User } from "../models/User";

export const requireRole = (
  ...allowedRoles: Role[]
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          error: "UNAUTHORIZED",
        });
      }

      const user = await User.findById(req.user.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "User account is not available",
          error: "UNAUTHORIZED",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this resource",
          error: "FORBIDDEN",
        });
      }

      req.user.role = user.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};