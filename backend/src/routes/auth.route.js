import { Router } from "express";
import {
  getUser,saveUser
} from "../controllers/auth.controller.js";

import { portfolioLogin, portfolioDetails } from "../controllers/portfolio.controller.js";

const router = Router();

router.get("/", getUser);
router.post("/", saveUser);
router.post("/dowell-login",portfolioLogin );
router.get("/dowell-login",portfolioDetails);

export default router;
