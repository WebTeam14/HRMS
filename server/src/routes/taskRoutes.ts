import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as taskController from "../controllers/taskController";

const router = Router();

// Team members list (for assign dropdown)
router.get("/members", authenticate, taskController.getTeamMembers);

// Alert counts for Dashboard badges
router.get("/alerts", authenticate, taskController.getTaskAlerts);

// Employee: my tasks
router.get("/my", authenticate, taskController.getMyTasks);

// Manager: full team board
router.get("/team", authenticate, taskController.getTeamTasks);

// Create task (manager assigns)
router.post("/", authenticate, taskController.createTask);

// Update status (employee/manager)
router.patch("/:id/status", authenticate, taskController.updateTaskStatus);

// Full edit (manager)
router.put("/:id", authenticate, taskController.updateTask);

// Delete (manager)
router.delete("/:id", authenticate, taskController.deleteTask);

export default router;
