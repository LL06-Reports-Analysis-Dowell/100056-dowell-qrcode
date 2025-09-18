import { Router } from "express";
import { batchScans } from "../controllers/scan.controller.js";
import { validateScans } from "../middleware/validateScans.js";

const router = Router();

router.post("/batch", validateScans, batchScans);

export default router;
