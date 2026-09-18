import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
} from "../services/profileService";

const handleProfileError = (
  error: unknown,
  res: Response,
  next: NextFunction
) => {
  if (!(error instanceof Error)) {
    return next(error);
  }

  const errorMap: Record<string, { status: number; message: string }> = {
    EMPLOYEE_PROFILE_NOT_FOUND: {
      status: 404,
      message: "Employee profile not found for this account",
    },
    USER_NOT_FOUND: {
      status: 404,
      message: "User account not found",
    },
    INVALID_CURRENT_PASSWORD: {
      status: 400,
      message: "Current password is incorrect",
    },
    INVALID_USER_ID: {
      status: 400,
      message: "Invalid user identifier",
    },
  };

  const matched = errorMap[error.message];
  if (matched) {
    return res.status(matched.status).json({
      success: false,
      message: matched.message,
      error: error.message,
    });
  }

  next(error);
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await getMyProfile(userId);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    handleProfileError(error, res, next);
  }
};

export const updateMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updated = await updateMyProfile(userId, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error) {
    handleProfileError(error, res, next);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { currentPassword, newPassword } = req.body;
    const result = await changeMyPassword(
      userId,
      currentPassword,
      newPassword
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    handleProfileError(error, res, next);
  }
};
