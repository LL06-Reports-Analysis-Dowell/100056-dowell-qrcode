import { Router } from "express";
import { createCollection, checkDatabaseStatus } from "../controllers/kitchensink.controller.js";

const router = Router();

router.get("/check-database-status",checkDatabaseStatus );
router.post("/create-collection", createCollection);
export default router;
