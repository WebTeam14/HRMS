import { Response, NextFunction } from "express";

import { AuthenticatedRequest } from "../types/auth";
import { User } from "../models/User";
import { ROLE_PERMISSIONS } from "../utils/rolePermissions";
import { Permission } from "../utils/permissions";

export const requirePermission = (
  permission: Permission
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

      /*
       * Get the current user from the database.
       *
       * We don't blindly trust the role stored inside
       * the JWT because an administrator might change
       * the user's role after the token was issued.
       */
      const user = await User.findById(req.user.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "User account is not available",
          error: "UNAUTHORIZED",
        });
      }

      const role = user.role;

      const permissions =
        ROLE_PERMISSIONS[role] || [];

      const hasPermission =
        permissions.includes(permission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
          error: "FORBIDDEN",
        });
      }

      /*
       * Keep the request user synchronized
       * with the current database role.
       */
      req.user.role = role;

      next();
    } catch (error) {
      next(error);
    }
  };
};