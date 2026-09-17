import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("API Error:", err);

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`,
      error: "INVALID_ID",
    });
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(", ");
    return res.status(409).json({
      success: false,
      message: `A record with this ${fields || "value"} already exists.`,
      error: "DUPLICATE_KEY",
      details: err.keyValue,
    });
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e: any) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", ") || "Database validation failed",
      error: "VALIDATION_ERROR",
    });
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: "UNAUTHORIZED",
    });
  }

  // Default Internal Server Error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
    error: err.error || "INTERNAL_SERVER_ERROR",
  });
};
