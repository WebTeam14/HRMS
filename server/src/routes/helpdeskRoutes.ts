import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as helpdeskController from "../controllers/helpdeskController";

const router = Router();

// Employee self-service
router.get("/my", authenticate, helpdeskController.getMyTickets);
router.post("/", authenticate, helpdeskController.createTicket);

// Management overview & resolution
router.get("/tickets", authenticate, helpdeskController.getAllTickets);
router.patch("/tickets/:id/resolve", authenticate, helpdeskController.resolveTicket);

export default router;
