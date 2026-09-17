import {
  Request,
  Response,
  NextFunction,
} from "express";

import { loginUser } from "../services/authService";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../types/auth";

/**
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      emailOrEmployeeId,
      password,
    } = req.body;

    if (!emailOrEmployeeId || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email/Employee ID and password are required",
        error: "VALIDATION_ERROR",
      });
    }

    const result = await loginUser({
      emailOrEmployeeId,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "AUTHENTICATION_ERROR",
      });
    }

    if (
      error instanceof Error &&
      error.message === "ACCOUNT_INACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
        error: "ACCOUNT_INACTIVE",
      });
    }

    next(error);
  }
};

/**
 * GET /api/auth/me
 */
export const getCurrentUser = async (
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

    const user = await User.findById(
      req.user.userId
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is not available",
        error: "UNAUTHORIZED",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};