import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env";
import { connectDatabase } from "./config/database";

import authRoutes from "./routes/authRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import designationRoutes from "./routes/designationRoutes";
import profileRoutes from "./routes/profileRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import leaveRoutes from "./routes/leaveRoutes";
import leaveTypeRoutes from "./routes/leaveTypeRoutes";
import workUpdateRoutes from "./routes/workUpdateRoutes";
import holidayRoutes from "./routes/holidayRoutes";
import payrollRoutes from "./routes/payrollRoutes";
import helpdeskRoutes from "./routes/helpdeskRoutes";
import testRoutes from "./routes/testRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// ========================================
// GLOBAL MIDDLEWARE
// ========================================

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// IMPORTANT: JSON parser MUST come before routes
app.use(express.json());


// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "HRMS API is running",
  });
});


// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/departments", departmentRoutes);

app.use("/api/designations", designationRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/leave", leaveRoutes);

app.use("/api/leave-types", leaveTypeRoutes);

app.use("/api/work-updates", workUpdateRoutes);

app.use("/api/holidays", holidayRoutes);

app.use("/api/payroll", payrollRoutes);

app.use("/api/helpdesk", helpdeskRoutes);

app.use("/api/test", testRoutes);

app.use("/api/employees", employeeRoutes);

// ========================================
// 404 & ERROR HANDLING
// ========================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found",
    error: "NOT_FOUND",
  });
});

app.use(errorHandler);

// ========================================
// START SERVER
// ========================================

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(
      `HRMS API running on http://localhost:${env.PORT}`
    );
  });
};

startServer();