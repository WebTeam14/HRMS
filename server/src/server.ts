import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import departmentRoutes from "./routes/departmentRoutes";
import authRoutes from "./routes/authRoutes";

const app = express();
app.use("/api/auth", authRoutes);

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "HRMS API is running",
  });
});

// Routes
app.use("/api/departments", departmentRoutes);

// Start server
const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(
      `HRMS API running on http://localhost:${env.PORT}`
    );
  });
};

startServer(); 