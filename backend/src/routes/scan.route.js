import { Router } from "express";
import { batchScans } from "../controllers/scanController.js";
import { validateScans } from "../middleware/validateScans.js";

const router = Router();

router.post("/batch", validateScans, batchScans);

export default router;
