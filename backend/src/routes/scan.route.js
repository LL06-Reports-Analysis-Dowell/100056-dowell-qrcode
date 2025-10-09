import { Router } from "express";
import { batchScans, createExhibitor, getExhibitors} from "../controllers/scan.controller.js";
import { validateScans } from "../middleware/validateScans.js";

const router = Router();

router.post("/batch", validateScans, batchScans);
router.post("/exhibitor", createExhibitor);
router.get("/exhibitors", getExhibitors);

export default router;
