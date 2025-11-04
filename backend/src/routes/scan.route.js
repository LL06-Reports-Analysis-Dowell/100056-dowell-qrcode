import { Router } from "express";
import { batchScans, createExhibitor, getExhibitors, validateToken } from "../controllers/scan.controller.js";
import { validateScans } from "../middleware/validateScans.js";

const router = Router();

router.post("/batch", validateScans, batchScans);
router.post("/exhibitor", createExhibitor);
router.get("/exhibitors", getExhibitors);
router.post("/validate-token", validateToken);

export default router;
