import { Router } from "express";
import {
  getUser,saveUser
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/", getUser);
router.post("/", saveUser);

export default router;
