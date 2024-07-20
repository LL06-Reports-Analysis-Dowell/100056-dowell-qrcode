import { Router } from "express";
import { saveStats, getAllStats } from "../controllers/stats.controller.js";

const router = Router();

router.get("/save-stats",saveStats );
router.post("/stats-report",getAllStats );


export default router;